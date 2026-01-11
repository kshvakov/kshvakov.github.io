---
title: "Speeding Up Go TLS to 100 Gbps: kTLS, Zero-Copy, and Production Gotchas"
date: 2024-12-02
description: "How to squeeze tens of gigabits out of a Go service over HTTPS: why TLS breaks zero-copy, how kTLS works, where moving encryption to the kernel helps, and what we had to change in production."
tags: ["go", "golang", "tls", "https", "ktls", "zero-copy", "sendfile", "splice", "linux", "performance", "cdn", "kinescope", "networking"]
---

When serving static content, everything seems simple: file on disk → `sendfile` → network. But once you enable HTTPS and try to push tens of gigabits per server, you discover: the expensive part isn't encryption itself, but **copies, buffers, and overhead in the data path**.

I'll cover the practical side: why TLS breaks **zero-copy** (transfer without copying), why kTLS is needed, what exactly changes in the data path, where the real gains come from, and what gotchas you'll encounter in production (including unexpected handshake spikes). At the end, I'll show what to look for in `perf` and `pprof` to avoid optimizing blindly.

"100 Gbps" in the title isn't a "technology limit" but a benchmark for **specific hardware and network configuration**. On a different platform (CPU, memory, kernel, NICs), the same approach can yield significantly more—or less.

Talk video:

{{< youtube id="5TipVdPRQ7s" title="Speeding Up Go TLS to 100 Gbps from Server / Kirill Shvakov" >}}

## TL;DR

- **At scale, it's not "encryption" that's expensive, but the overhead around it**: extra copies, allocations, and buffers quickly hit memory, CPU cache, and GC limits.
- **Zero-copy in Linux (`sendfile`, `splice`) is key to throughput**, but TLS in userspace breaks zero-copy because data must be encrypted.
- **kTLS moves the TLS record layer into the kernel**: you write unencrypted data to the socket, and the kernel forms TLS records and encrypts them. This restores zero-copy (primarily on send).
- **kTLS isn't available "out of the box" in Go**: you need to extract cryptographic secrets (keys and parameters) from the handshake (e.g., `SetTrafficSecret` in TLS 1.3) and configure the socket correctly.
- **Practice**: on production traffic, we hit roughly **~73 Gbps** per server with **~40,000 connections**. Beyond that, the platform sets the limits (network, memory, kernel, drivers).
- **kTLS barely helps if you *generate* content in userspace**: maximum effect is when you **serve "as-is"** (files/chunks) and can enable zero-copy.

## Context: Why This Became a Problem

Kinescope is a video platform. We process video and serve it through our own content delivery network (CDN)[^cdn-background]. External connections number in the hundreds of thousands, traffic in the hundreds of gigabits. And in 2024–2025, "normal" internet traffic is **HTTPS** almost everywhere.

Here's the thing: "HTTP serves fast" is one thing, but **HTTP inside TLS** at scale is another. At megabits, you don't notice. At tens of gigabits, the problem becomes obvious.

## How TLS Works (Without Cryptography)

I'll barely touch cryptography here—that's a separate large topic. What matters is the engineering mechanics:

1. **TCP connection**.
2. **TLS handshake**: client and server agree on version/ciphers and obtain cryptographic secrets—symmetric keys and parameters (IV/nonce) that will be used to encrypt TLS records in both directions.
3. **Data exchange**: the application reads/writes bytes, while "inside" data is packed into TLS records and encrypted/decrypted.

I'll use two terms:

- **userspace** — application code in user space;
- **kernelspace** — Linux kernel and network stack.

The key word here is *"inside"*: that determines whether zero-copy happens.

### What Changes When You "Enable TLS"

For serving large files, one question matters: **where is the data when encryption happens**.

#### 1) HTTP Without TLS: Zero-Copy "Just Works"

```text
file on disk
   |
   |  (sendfile)
   v
kernel (page cache / TCP stack)
   |
   v
NIC -> network -> client
```

Ideally, the application does minimal work: "glues" HTTP headers and tells the kernel: "here's the file, here's the socket."

#### 2) TLS in Userspace: Zero-Copy Breaks Due to Encryption

```text
file on disk
   |
   |  read()
   v
userspace (Go)
   |   encrypt (crypto/tls)
   v
userspace buffer
   |
   |  write()
   v
kernel (TCP stack)
   |
   v
NIC -> network -> client
```

Two problems appear immediately: copying data back and forth, plus allocations for buffers.

#### 3) TLS with kTLS: Restoring Zero-Copy on Send

```text
file on disk
   |
   |  (sendfile)  +  kTLS record layer in kernelspace
   v
kernel (TLS record + crypto + TCP stack)
   |
   v
NIC -> network -> client
```

Important limitation: kTLS works especially well where you can actually use the zero-copy path (e.g., serving files/chunks, not generating content in memory).

## Why TLS Becomes a Problem at Scale

Technically, it looks simple: a TCP connection is established, a TLS handshake completes, then encrypted data flows over the connection.

"Encryption is expensive" is a meme phrase. In reality, on typical web scenarios, it rarely becomes the main problem. But once you start transferring **large volumes of data**, the cost rises sharply—and often it's not the cost of cryptography, but **copying**:

- data must be lifted into userspace;
- encrypted (which already requires buffer work);
- sent back into kernelspace;
- and all of this interacts with CPU cache and (in Go) GC[^go-gc-problems].

At the OS level, this looks like: instead of a direct data stream, you get many `read`/`write` cycles, growing allocations, and increased pressure on the memory subsystem. Then physics kicks in: **memory bandwidth and cache misses** start limiting speed sooner than CPU on average.

### Why Sometimes It's Not CPU, But Memory and Cache

If you're serving 70–100 Gbps, you're pushing **gigabytes per second** through the system. Let's calculate: 100 Gbps is roughly 12.5 GB/s. At that rate, any extra copy "consumes" memory bandwidth and cache:

- **one extra copy** → data passes through memory twice instead of once, doubling load on memory bandwidth;
- **two extra copies** → even more expensive, sometimes multiples (especially if copies go through different cache levels);
- **plus control structures/buffers** → allocations that in Go can pull in GC and create additional pauses.

Why is this critical? Modern CPUs can encrypt AES-GCM at tens of gigabits, but **memory bandwidth** is limited. For example, on a typical server CPU, memory bandwidth might be 50–100 GB/s, but that must be shared across all cores and all operations. If you're spending 12.5 GB/s on one extra copy, that's already a noticeable share of available bandwidth.

Additionally, each copy passes through CPU cache (L1/L2/L3). At large data volumes, cache misses become frequent, and the processor starts waiting for data from main memory. This creates "bubbles" in the pipeline and reduces efficiency.

So optimizing "copy less" often yields not "slightly faster," but **significant headroom**—sometimes multiples—because you're removing a bottleneck at the memory level, not CPU.

## Zero-Copy in Linux and Why It Matters

Unix systems have system calls that let you "move" data **without lifting it into userspace**[^zero-copy-syscalls]:

- `sendfile` — send data from a file directly to a socket;
- `splice` — transfer data between descriptors (e.g., socket to socket) via a pipe.

When zero-copy works, the application barely "participates": it tells the OS "here's a file descriptor, here's a socket, send N bytes there," and data flows along a shorter path.

This is critical for us because serving isn't "a few kilobytes of HTML," but **megabytes and gigabytes**. (For more on practical zero-copy use in CDN, see [Serving Content from HDDs]({{< relref "serving-content-from-hdds.md" >}}).)

### Where Zero-Copy Breaks

In TLS, data must be **encrypted**. So classic zero-copy "as-is" doesn't work: you can't just "move" bytes from file to socket—they need transformation.

If TLS is implemented in userspace, you almost inevitably end up with: read data into userspace, encrypt in userspace, write to socket. Zero-copy disappears—and overhead begins.

### Why `io.Copy` Isn't a Zero-Copy Guarantee in Go

Go can accelerate copying through special interfaces, but this depends on specific types and implementation:

```text
io.Copy(dst, src)
  |
  +--> fast path (if src implements WriteTo or dst implements ReadFrom)
  |
  +--> slow path: Read -> Write loop (buffer in userspace, allocations/copies)
```

So when optimizing "file serving," check not just CPU profiles, but which path copying actually took. I'll show how to see this below.

## "Cheap Clients" and Ciphers: First, Make Sure You Have a Problem

Before "fixing TLS," **measure** first.

We added metrics for cipher suites in use—the profile heavily depends on the client base. Often, some clients choose ciphers that are more expensive on the server. Sometimes this also breaks hardware acceleration—and performance drops sharply.

This way you see what's actually used in production, understand what percentage of traffic is potentially "expensive," and only then decide what to do: change cipher policy, change TLS version, enable/disable specific options, etc.

Next—a systems architecture solution.

## kTLS: The Idea of "Moving TLS Closer to the Kernel"

**kTLS (kernel TLS)** is a mechanism where part of TLS (the record layer) is moved into kernelspace.

The idea is that you still do the **handshake** with a regular TLS library (in userspace). But once keys are obtained, you **pass them to the kernel**, enable kTLS mode for the socket—and then work with the connection "like normal": write unencrypted data to the socket, and the kernel encrypts it itself.

If the kernel can encrypt on send, it can use zero-copy mechanisms again and reduce copies/allocations.

### What Is TLS Record Layer and Why It Matters

TLS works at the record level. Each record consists of:
- header (record type, TLS version, length);
- encrypted data;
- MAC (Message Authentication Code) or authentication tag (for AEAD ciphers).

When TLS is implemented in userspace, the application must:
1. Split data into records of the needed size.
2. Add header.
3. Encrypt data.
4. Add MAC/tag.
5. Send the finished record to the kernel.

kTLS moves steps 1–4 into the kernel. The application simply writes unencrypted data, and the kernel forms records, encrypts them, and sends them to the network.

### Limitations: Why We Only Use TX (Send)

In our fork, kTLS is enabled **only for outgoing traffic (TX)**. This is a deliberate choice for several reasons:

1. **For content serving, TX is the main load**. Incoming traffic (RX) is mostly short HTTP requests that don't create performance problems.

2. **RX kTLS is harder to implement**. For incoming traffic, you need to decrypt data in the kernel and pass it to userspace. This requires more complex integration with Go's read code.

3. **Kernel versions and stability**. TX kTLS is stable since Linux 5.15+, while RX kTLS has more limitations and bugs across kernel versions.

4. **Practical effect**. For a CDN scenario where we serve large files, optimizing TX gives 90%+ of the gain. Optimizing RX would be "nice to have," but not critical.

If you need RX kTLS, it's possible, but will require additional work and testing on your platform.

### History: Netflix/Facebook and Unexpectedly Oracle

kTLS history doesn't begin with Linux and FreeBSD. Oracle Solaris had **KSSL** — a kernel-side proxy for SSL/TLS that performs SSL traffic processing in the kernel (same idea: move the record layer closer to the network stack for performance) — see the description in Oracle Solaris documentation ([kssl(5)](https://docs.oracle.com/cd/E23823_01/html/816-5175/kssl-5.html)).

**Kernel TLS** first appeared in **FreeBSD 13.0** ([ktls(4)](https://man.freebsd.org/cgi/man.cgi?query=ktls&sektion=4)); **FreeBSD 13.0-RELEASE** was released on **April 13, 2021** ([announcement](https://www.freebsd.org/releases/13.0R/announce/)). However, it's worth noting that **Netflix used kTLS in FreeBSD much earlier** — the company began implementing this technology as early as 2016 to optimize performance when serving video content, well before kTLS made it into the official FreeBSD release.

kTLS made it into Linux mainline on **June 15, 2017**: commit **"tls: kernel TLS support"** adds TLS as a ULP over TCP, with keys passed to the kernel via `setsockopt` after handshake completion, and only symmetric encryption performed in the kernel ([commit 3c4d755](https://github.com/torvalds/linux/commit/3c4d7559159bfe1e3b94df3a657b2cda3a34e218)). The user interface and working model (TLS ULP, separate TX/RX, `sendfile` example) are described in the official Linux kernel documentation ([Kernel TLS docs](https://docs.kernel.org/networking/tls.html)).

### Bonus: Offload to Network Card

In some scenarios, TLS can be partially offloaded to the NIC (TLS offload). In practice, this heavily depends on hardware availability and environment—in some regions this can hit logistics/cryptography/certification issues.

In our fork, there's a commented line for TX zero copy at the NIC level:

```go
		if kernel.TLS_TX_ZEROCOPY {
			//	syscall.SetsockoptInt(int(fd), unix.SOL_TLS, TLS_TX_ZEROCOPY_RO, 1)
		}
```

This requires NICs with hardware TLS offload support, which isn't available in our case.

## Why "Just Enabling kTLS in Go" Didn't Work

At the idea level, it's simple: take Go, enable kTLS, and rejoice. In practice, there are two big "buts":

1. **You need to extract keys** (traffic secrets) from the TLS handshake and pass them to the kernel.
2. **You need to change the write path**: after enabling kTLS on a socket, you can't keep writing already-encrypted TLS records—you need to write unencrypted data.

So in reality, we made a small patch/fork of the TLS part that:

- intercepts cryptographic secrets (encryption keys and parameters like IV/nonce) at the handshake stage;
- enables kTLS options on the socket;
- and then allows using standard serving mechanisms, including the path that gives zero-copy.

Below I'll break down the key steps in order, so it's clear what exactly happens under the hood.

## Practice: How to "Attach" kTLS to Go TLS (Step-by-Step)

Let's see how we integrated kTLS into a fork of the standard `crypto/tls` package. This will help understand not just "what to do," but "why exactly this way."

> **Note**: a minimal working example implementation is available in a [public gist](https://gist.github.com/kshvakov/3ad0017158e790ebb66b70be1e687caf). This is a simplified version for the talk presentation that demonstrates the main ideas, but isn't used in production. For real use, it's better to look at the fork's source code. Below I'll cover the key parts with explanations.

### Step A: Checking Conditions and Auto-Detecting Capabilities

Before enabling kTLS, you need to ensure the kernel supports it. In our fork, this is done in the `init()` function:

```go
func init() {
	if _, err := os.Stat("/sys/module/tls"); err != nil {
		fmt.Println("kernel TLS module not enabled (hint: sudo modprobe tls).")
		return
	}
	var uname unix.Utsname
	if err := unix.Uname(&uname); err != nil {
		return
	}
	kernelVersion, err := semver.Parse(strings.Trim(string(uname.Release[:]), "\x00"))
	if err != nil {
		return
	}
	kernelVersion.Pre = nil
	kernelVersion.Build = nil
	switch {
	case kernelVersion.GTE(semver.Version{Major: 5, Minor: 19}):
		kernel.TLS_TX_ZEROCOPY = true
		fallthrough
	case kernelVersion.GTE(semver.Version{Major: 5, Minor: 15}):
		kernel.TLS = true
	}
	if !kernel.TLS {
		fmt.Println("kTLS is disabled.")
		return
	}
	fmt.Println("=== kTLS ===")
	fmt.Println("kernel: ", kernelVersion)
	{
		fmt.Printf("TX: zero copy  = %t\n", kernel.TLS_TX_ZEROCOPY)
	}
	fmt.Println("============")
}
```

What happens here:

1. Check for kernel module `/sys/module/tls`—if it's missing, kTLS isn't available.
2. Parse kernel version via `uname` and check minimum requirements:
   - **Linux >= 5.15** — basic kTLS support;
   - **Linux >= 5.19** — additionally enables TX zero copy support (for NICs with hardware offload).
3. Save the result in global variable `kernel` so we don't check this on every connection.

### Step B: Where to Get Keys, IV, and Sequence Number

Key point: standard `crypto/tls` doesn't save cryptographic secrets (`key`, `iv`) in the `halfConn` structure—it immediately creates an encryption object (AEAD) and uses it. For kTLS, we need **raw keys and parameters** to pass to the kernel.

In our fork, we added `key` and `iv` fields to the `halfConn` structure:

```go
	// kTLS
	key, iv []byte
}
```

Now we need to save these values in two places:

**For TLS 1.3** — in the `setTrafficSecret` function:

```go
func (hc *halfConn) setTrafficSecret(suite *cipherSuiteTLS13, level QUICEncryptionLevel, secret []byte) {
	hc.trafficSecret = secret
	hc.level = level
	hc.key, hc.iv = suite.trafficKey(secret)
	hc.cipher = suite.aead(hc.key, hc.iv)
	for i := range hc.seq {
		hc.seq[i] = 0
	}
}
```

**For TLS 1.2** — in the `prepareCipherSpec` function (called during handshake):

```go
func (hc *halfConn) prepareCipherSpec(version uint16, cipher any, mac hash.Hash, key, iv []byte) {
	hc.version = version
	hc.nextCipher = cipher
	hc.nextMac = mac
	hc.key = key
	hc.iv = iv
}
```

Note: in TLS 1.2, `prepareCipherSpec` now takes `key` and `iv` as parameters, because they're computed in `establishKeys()` and passed there explicitly.

### Step C: Preparing Structure for Kernel (Cipher Suite → crypto_info)

The Linux kernel expects cryptographic secrets (keys and parameters) in a special binary structure. For each cipher suite, the structure is different. For example, for AES-128-GCM:

```go
type kTLSCryptoAES128GCM struct {
	kTLSCryptoInfo
	iv      [kTLS_CIPHER_AES_GCM_128_IV_SIZE]byte
	key     [kTLS_CIPHER_AES_GCM_128_KEY_SIZE]byte
	salt    [kTLS_CIPHER_AES_GCM_128_SALT_SIZE]byte
	rec_seq [kTLS_CIPHER_AES_GCM_128_REC_SEQ_SIZE]byte
}

func (crypto *kTLSCryptoAES128GCM) String() string {
	crypto.cipher = kTLS_CIPHER_AES_128_GCM
	return string((*[unsafe.Sizeof(*crypto)]byte)(unsafe.Pointer(crypto))[:])
}
```

Important point about **salt and IV for AES-GCM**: in TLS, IV consists of two parts—fixed salt (4 bytes) and explicit nonce (8 bytes). The kernel expects them separately:

```go
		{
			copy(crypto.key[:], hc.key)
			copy(crypto.iv[:], hc.iv[4:])
			copy(crypto.salt[:], hc.iv[:4])
		}
```

The `kTLSCipher()` function selects the needed structure depending on the cipher suite and fills it with data from `halfConn`:

```go
func (hc *halfConn) kTLSCipher(cipherSuite uint16) fmt.Stringer {
	if !kernel.TLS {
		return nil
	}

	switch cipherSuite {
	case TLS_AES_128_GCM_SHA256, TLS_RSA_WITH_AES_128_GCM_SHA256, TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256, TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:
		crypto := &kTLSCryptoAES128GCM{
			kTLSCryptoInfo: kTLSCryptoInfo{
				version: hc.version,
			},
			rec_seq: hc.seq,
		}
		{
			copy(crypto.key[:], hc.key)
			copy(crypto.iv[:], hc.iv[4:])
			copy(crypto.salt[:], hc.iv[:4])
		}
		return crypto
```

### Step D: Activating ULP "tls" and Setting Keys in Kernel

After a successful handshake, `enableKernelTLS()` is called. This function does three things:

1. Checks conditions (QUIC disabled, kTLS available, `DisableKernelTLS` flag not set).
2. Prepares the `crypto_info` structure for the kernel.
3. Sets socket options via `setsockopt`:

```go
func (c *Conn) enableKernelTLS() error {
	promCipherSuiteReqTotal.WithLabelValues(CipherSuiteName(c.cipherSuite)).Inc()
	if c.quic != nil || !kernel.TLS || c.config.DisableKernelTLS {
		return nil
	}
	out := c.out.kTLSCipher(c.cipherSuite)
	if out == nil {
		return nil
	}
	rawConn, err := c.conn.(*net.TCPConn).SyscallConn()
	if err != nil {
		return err
	}
	return rawConn.Control(func(fd uintptr) {
		if err := syscall.SetsockoptString(int(fd), unix.SOL_TCP, unix.TCP_ULP, "tls"); err != nil {
			return
		}
		if err := syscall.SetsockoptString(int(fd), unix.SOL_TLS, TLS_TX, out.String()); err != nil {
			return
		}
		c.out.cipher = kTLSCipher{}
		if kernel.TLS_TX_ZEROCOPY {
			//	syscall.SetsockoptInt(int(fd), unix.SOL_TLS, TLS_TX_ZEROCOPY_RO, 1)
		}
	})
}
```

What happens here:

- `SetsockoptString(fd, SOL_TCP, TCP_ULP, "tls")` — enables ULP (Upper Layer Protocol) "tls" for the socket. This tells the kernel this socket will use kTLS.
- `SetsockoptString(fd, SOL_TLS, TLS_TX, cryptoInfo)` — passes cryptographic secrets (keys and parameters) to the kernel. The `crypto_info` structure is serialized to bytes via the `String()` method (which uses `unsafe.Pointer` to directly convert the structure to bytes).
- `c.out.cipher = kTLSCipher{}` — replace the encryption object with a special marker `kTLSCipher`, so the code knows encryption is done by the kernel.

The call to `enableKernelTLS()` happens **after handshake completion**, in `handshake_server.go` and `handshake_server_tls13.go`:

```go
	if err := c.enableKernelTLS(); err != nil {
		return err
	}
```

### Step E: Sending Alert and Handshake Messages After Enabling kTLS

After enabling kTLS, the kernel only encrypts **application data**. But sometimes you need to send Alert or Handshake messages (e.g., when closing a connection or renegotiation). For this, you need to explicitly tell the kernel the TLS record type via a control message in `sendmsg`.

Implementation in `ktlsWriteRecord()`:

```go
func (c *Conn) ktlsWriteRecord(typ recordType, b []byte) (_ int, se error) {
	switch typ {
	case recordTypeApplicationData:
		return c.write(b)
	case recordTypeAlert, recordTypeHandshake, recordTypeChangeCipherSpec:
	default:
		panic("kTLS: tried to send unsupported data type")
	}

	buffer := make([]byte, unix.CmsgSpace(1))
	cmsg := (*unix.Cmsghdr)(unsafe.Pointer(&buffer[0]))
	cmsg.SetLen(unix.CmsgLen(1))
	buffer[unix.SizeofCmsghdr] = byte(typ)
	cmsg.Level = unix.SOL_TLS
	cmsg.Type = TLS_SET_RECORD_TYPE

	iov := unix.Iovec{
		Base: &b[0],
	}
	iov.SetLen(len(b))

	msg := unix.Msghdr{
		Iov:        &iov,
		Iovlen:     1,
		Control:    &buffer[0],
		Controllen: cmsg.Len,
	}
	rawConn, err := c.conn.(*net.TCPConn).SyscallConn()
	if err != nil {
		return 0, err
	}

	var n int
	if e := rawConn.Write(func(fd uintptr) bool {
		n, err = sendmsg(int(fd), &msg, 0)
		if err == unix.EAGAIN {
			return false
		}
		return true
	}); e != nil {
		return n, e
	}
	return n, err
}
```

For `application data`, we simply write data to the socket—the kernel adds the TLS record header and encrypts. For other record types, we form a control message with type `TLS_SET_RECORD_TYPE` and send via `sendmsg`.

This function is called from `writeRecordLocked()` when the `kTLSCipher` marker is detected:

```go
func (c *Conn) writeRecordLocked(typ recordType, data []byte) (int, error) {
	if _, ok := c.out.cipher.(kTLSCipher); ok {
		return c.ktlsWriteRecord(typ, data)
	}
```

### Step F: Restoring Fast Path "File → Socket"

The most important thing for performance is optimizing the `ReadFrom` method. When kTLS is enabled, we can write unencrypted data directly to the TCP socket, and the kernel encrypts it. This allows using `io.Copy` directly on the TCP connection, bypassing userspace encryption:

```go
func (c *Conn) ReadFrom(r io.Reader) (n int64, err error) {
	if _, ok := c.out.cipher.(kTLSCipher); !ok {
		return io.Copy(&tlsConnWithoutReadFrom{c: c}, r)
	}
	if err := c.Handshake(); err != nil {
		return 0, err
	}
	return io.Copy(c.conn, r)
}
```

What happens here:

- If kTLS isn't enabled, use the standard path via wrapper `tlsConnWithoutReadFrom` (which will encrypt data in userspace).
- If kTLS is enabled, do `io.Copy(c.conn, r)` — this allows Go to use optimizations like `sendfile` if `r` is a file or another source supporting zero-copy.

This optimization gives the main gain: when you serve a file via `io.Copy(tlsConn, file)`, data flows directly from file to network through the kernel, without copying into userspace.

### How It Works: Unencrypted Data and Zero-Copy

Key point of kTLS operation: after enabling kTLS, you write **unencrypted data** to the socket, and the record layer and encryption become the kernel's job. This is why zero-copy returns: the application no longer needs to lift data into userspace for encryption—the kernel does it, and data can flow directly from file to network via `sendfile` or `splice`.

## Where We Win: `sendfile`, `splice`, and "Files As-Is"

Important detail from the Go world: for the application to actually use zero-copy, "just `io.Copy`" isn't enough.

Go has optimizations via interfaces (`ReadFrom` / `WriteTo`) that let some Reader/Writer combinations fall through to more efficient system calls.

So the main practical case that actually gives an effect:

- **serve a file** (or a large chunk of a file) to a connection **so the write path can become `sendfile`**;
- and delegate encryption to the kernel (kTLS).

This combination yields "zero-copy again, but over TLS."

### Why HTTP Serving Fits Well with `sendfile`

In classic HTTP, a response is simple: headers first, then body. And if the body is a file (or a large range of a file), you really want to:

- send headers with a regular write;
- body — `sendfile`.

This gives most of the gain: the application stops being a "byte pipeline."

## Production Results (And Why They're Like This)

Benchmark levels:

- target server load: tens of gigabits, with headroom;
- in one run: **~73 Gbps** on production traffic with **~40,000 connections**;
- meanwhile, the application almost stops being "where CPU burns"—beyond that, network, memory, kernel, and environment start determining results.

The ceiling here isn't set by "Go" or "kTLS," but by the **specific platform** (memory bandwidth, CPU, network, drivers, kernel version, IRQ/softirq balance, NIC configuration). On different hardware, you'll hit different limits and may see both smaller and significantly larger numbers.

How to read these numbers correctly:

- this isn't "kTLS magic";
- this is the sum of many things: zero-copy path, correct buffer handling, removing extra copies, and delegating to the kernel removing a mass of overhead at the runtime/GC level.

## Handshake Is Expensive Too: Certificates and Session Resumption

When you reduce the cost of "data transfer" via kTLS, other costs come to the fore—in particular, **TLS handshake**. If CPU used to "burn" on data encryption, now it can "burn" on connection setup.

Here are practical steps to reduce handshake load:

### Moving from RSA to ECDSA Certificates

If you still have **RSA certificates** in your chain, for some CPUs this can be noticeably more expensive than ECDSA. Reason: RSA operations require more computation than elliptic curve operations.

**Order of magnitude** from a simple benchmark: RSA handshake is roughly "several times" more expensive than on elliptic curves (naturally, numbers depend on CPU and environment; the order matters). For more details on the RSA handshake performance issue in Go, see [issue #20058](https://github.com/golang/go/issues/20058).

**What to do**: simply replace certificates with ECDSA. Modern browsers and clients support ECDSA without issues. This is a "cheap win" that doesn't require code changes.

### Session Resumption and Shared Ticket Key

Go (and browsers) can resume TLS sessions via **session tickets** (TLS 1.2) or **PSK** (TLS 1.3). This reduces the cost of repeated connections: instead of a full handshake, a short exchange happens, which is multiple times faster.

**Problem**: if you have many servers behind one domain (e.g., behind a load balancer) and requests from one client hit different machines, then for effective resumption you need to **synchronize the "secret" (ticket key)** between servers. Otherwise, the client gets a ticket from server A, but on the next request hits server B, which can't decrypt that ticket, and a full handshake is needed.

**Solution**: set a shared ticket key for all servers. In Go, this is done via `Config.SessionTickets` or `SetSessionTicketKeys()`. For CDN content, this is an acceptable compromise, because we're not talking about "secret data," but speeding up serving public content.

**Important**: a shared ticket key reduces security (if one server is compromised, all servers are at risk), but for public content this is an acceptable trade-off for performance.

### Unexpected Cause of Handshake Spikes: HTTP 400+ and "Smart" Browsers

Practical detail from production: if you serve video and legitimately use **400+ response codes** (e.g., for manifests/range management), browsers can behave "too smart": close the connection and open a new one.

**Why this happens**: browsers think that if the server returned an error, the connection might be "bad," and it's better to open a new one. This makes sense for reliability, but creates additional TLS load.

#### How "Legitimate 4xx" Turns into "Handshake Storm"

```text
client request #1  --->  server responds 4xx/5xx
      |
      +--> browser closes connection (to be "faster/more reliable")
               |
               +--> new TCP connection
                       |
                       +--> new TLS handshake
                               |
                               +--> request #2 (and so on in a loop)
```

If on this path you have an expensive full handshake and no stable resumption between servers, you'll see **"strange" CPU and latency spikes** without visible growth in useful traffic.

**What to do**:

1. **Monitor correlation** between the number of 4xx/5xx responses and the number of handshakes. If you see a handshake spike after an error spike—that's it.
2. **Optimize error handling**: maybe some 4xx can be avoided or handled differently.
3. **Ensure resumption works**: if resumption works stably, even when connections close, handshake will be fast.

### Monitoring Handshake: What to Watch

Add metrics to track:

- **Number of full handshakes vs resumption** — resumption share should be high (80%+ for typical web traffic).
- **Handshake time by percentiles** (p50, p95, p99) — this helps see if performance is degrading.
- **Handshake RPS** — if this number grows without growth in useful traffic, something's wrong.
- **Correlation with 4xx/5xx** — if handshake grows together with errors, that's a sign of a browser problem.

These metrics help quickly find the problem when it appears.

## How to Measure: `perf` and `pprof` (What to Look For and How to Interpret)

Practical minimum that helps understand *where you're losing speed*: in cryptography, in copies, in GC, in system calls, in the kernel, or in the network stack.

### Base: What Metrics to Collect Before Profiling

- **TLS**:
  - share of **full handshake** vs **session resumption**;
  - **cipher suite** distribution;
  - p50/p95/p99 handshake time;
  - handshake RPS and correlation with 4xx/5xx.
- **Application**:
  - RPS, p95/p99 latency, errors;
  - allocations/sec, heap size, GC pauses/CPU;
  - number of active connections.
- **OS/hardware**:
  - CPU load by cores;
  - memory: bandwidth/LLC misses (if you have access to extended counters);
  - network: drops/softnet, IRQ load.

### pprof: Quick Answer "Where Go Code Burns"

Enable `net/http/pprof` (if not already) and take profiles at peak.

What to look for in CPU profile:

- `crypto/tls` / `crypto/*` — if handshake/encryption really dominates;
- `runtime.mallocgc`, `runtime.gcBgMarkWorker`, `runtime.scanobject` — if GC "wins";
- `io.copyBuffer` / `bufio` / your `Read`/`Write` loops — if you're really moving bytes through userspace.

What to look for in alloc/heap profiles:

- large allocations on the "response → socket write" path;
- buffers that can be reused (pool) or removed by returning to zero-copy.

Useful commands:

```bash
# CPU profile for 30 seconds:
go tool pprof -http=:0 http://127.0.0.1:6060/debug/pprof/profile?seconds=30

# Heap:
go tool pprof -http=:0 http://127.0.0.1:6060/debug/pprof/heap

# Allocations:
go tool pprof -http=:0 http://127.0.0.1:6060/debug/pprof/allocs
```

### `perf`: Quick Answer "Where System/Kernel Burns"

If `pprof` shows "everything's fine," but the server still hits limits—often this means the limit is already outside Go code: system calls, kernel, network, memory.

#### `perf top`: See "Who's on Top" Right Now

```bash
sudo perf top
```

Example interpretations:

- lots of time in `crypto_*` → real cost of cryptography;
- lots of time in `copy_user_*`, `memcpy*` → you're copying too much;
- lots of time in `tcp_sendmsg`, `skb_*`, `ip_*` → hitting network stack limits;
- lots of time in `ksoftirqd/*` / IRQ handlers → possibly network interrupts and softirq becoming a bottleneck.

#### `perf record`/`perf report`: Take Profile Over Interval and Analyze Calmly

```bash
# system-wide profile for 30 seconds
sudo perf record -F 99 -a -- sleep 30
sudo perf report
```

If you need to narrow to a process:

```bash
sudo perf record -F 99 -p <PID> -- sleep 30
sudo perf report
```

#### `perf stat`: Quickly Check "Copies/Cache/Branches" (If Available)

```bash
sudo perf stat -p <PID> -- sleep 10
```

This helps see if you're hitting cache misses/branches/instructions per byte of useful work. In "production," this is often more important than "CPU percentage."

### How to Tell You Really Don't Have Zero-Copy

Signals that usually coincide:

- **pprof CPU** shows lots of `io.copyBuffer`/Read→Write loops;
- **allocs/heap** grow with traffic on send;
- **`perf top`** shows `copy_user_*`/`memcpy*` in a noticeable share.

If you expect `sendfile`/`splice`, but see the above—you're still a "byte pipeline," and TLS/Go/GC will hurt as traffic grows.

### How to Verify kTLS Actually Enabled

After implementing kTLS, it's important to ensure it's actually working. Here are several ways to check:

**1. Application startup logs**

If kTLS is available, you'll see in logs:

```
=== kTLS ===
kernel: 5.19.0
TX: zero copy  = true
============
```

If the kernel module isn't loaded, there will be a warning:

```
kernel TLS module not enabled (hint: sudo modprobe tls).
```

**2. Check via `/proc/net/tls`**

The Linux kernel exports kTLS connection info via `/proc/net/tls`. If kTLS is active, you'll see entries:

```bash
cat /proc/net/tls
```

**3. Profiling: Before/After Comparison**

Take `pprof` profiles before and after enabling kTLS:

- **Before**: you should see lots of time in `crypto/tls.*encrypt*`, `io.copyBuffer`, buffer allocations.
- **After**: time in `crypto/tls` should drop sharply (handshake remains, but encryption moves to kernel), `io.copyBuffer` should disappear or become rare, allocations on the write path should decrease.

**4. Monitoring System Calls via `strace`**

Run the application under `strace` and look at system calls:

```bash
strace -e trace=sendfile,write,sendmsg -p <PID>
```

If kTLS works, you should see lots of `sendfile` for large files and minimal `write`/`sendmsg` on the data path.

**5. Performance Metrics**

Add metrics to your application to track:
- How many connections use kTLS (can add a counter in `enableKernelTLS()`).
- Distribution by cipher suites (already in our fork via Prometheus metrics).
- Throughput comparison before/after.

If after all checks you see kTLS didn't enable, check:
- Is kernel module loaded: `lsmod | grep tls` or `cat /sys/module/tls/refcnt`.
- Kernel version: `uname -r` (need >= 5.15).
- Is `DisableKernelTLS` flag set in TLS config.
- Is QUIC used (kTLS doesn't work with QUIC).

## Important Limitations and Production Gotchas

### kTLS Won't Speed Up Content Generation

If you **generate data in memory** (e.g., JSON responses, HTML templates, dynamic content), kTLS won't give much gain. You're still doing work in userspace: allocations, formatting, serialization. kTLS only helps at the stage of **transferring already-ready data** from file or buffer to network.

Maximum kTLS effect is when you serve **static files** or **large data chunks** that can be transferred via `sendfile`/`splice` without modification.

### Kernel Versions Matter

Different Linux versions had different kTLS capabilities and bugs:

- **Linux 5.15–5.18**: basic kTLS support, but can have stability issues on some platforms.
- **Linux 5.19+**: added TX zero copy support for NICs with hardware offload.
- **Some kernel versions**: known bugs with handling large records or under high load.

In production, sometimes you have to consciously use only part of the functionality (e.g., only send, as in our case) or disable kTLS for certain cipher suites if they cause problems.

**Recommendation**: test kTLS on the same kernel version and configuration you use in production. Differences between distributions (even with the same kernel version) can affect behavior.

### HTTP/2 and QUIC: Other Challenges

At the "lots of traffic" level, you often want to move to QUIC/HTTP3, but for mass serving of large files, this can again hit copies/execution model and require a different approach.

**Important**: kTLS **doesn't work with QUIC**. In our fork, there's an explicit check:

```go
	if c.quic != nil || !kernel.TLS || c.config.DisableKernelTLS {
		return nil
	}
```

If you use QUIC, kTLS automatically disables. This is a protocol limitation: QUIC requires more complex packet handling that isn't compatible with the current kTLS implementation in the kernel.

### Unexpected Cipher Suite Problems

Not all cipher suites are supported by kTLS. In our fork, we support:

- TLS 1.3: `TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`
- TLS 1.2: `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256`, `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`, and several others

If a client chooses an unsupported cipher suite, kTLS won't enable, and the connection will work via regular userspace TLS. This is normal, but it's important to monitor what percentage of connections actually use kTLS.

### Problems with Load Balancers and Proxies

If there's a load balancer or proxy in front of your server that does TLS termination, kTLS on your server won't help—the connection between the balancer and server is already not TLS (or it's a different TLS connection).

kTLS is only effective when **your server** does TLS termination and serves data directly to the client.

## Checklist: If You Want to Repeat This

- **Metrics before optimizations**:
  - cipher suite distribution;
  - share of full handshake vs resumption;
  - handshake time by percentiles;
  - handshake RPS (and correlation with 4xx/5xx and traffic peaks).
- **First "cheap wins"**:
  - if you have RSA—think about ECDSA;
  - enable and stabilize resumption between servers.
- **Then—data architecture**:
  - achieve real zero-copy (`sendfile`/`splice`) on "regular HTTP";
  - remove extra copies and allocations on the "file → network" path.
- **And only then—kTLS**:
  - learn to correctly pass keys to the kernel;
  - ensure that after enabling kTLS you write unencrypted data;
  - test on kernels/drivers you actually use in production.

## Summary

The main idea is simple: at very high speeds, what's "expensive" isn't TLS as a concept, but **everything that makes data pass through application memory an extra time**.

If your case is serving large volumes of data "as-is" (files/chunks), then the combination:

- **zero-copy (sendfile/splice)** + **kTLS**

can give a large and very "tangible" gain.

If you generate content in userspace, kTLS isn't a silver bullet: first you need to optimize the data path itself and allocations.

## Useful Resources

- [kTLS: Kernel TLS for Linux](https://www.kernel.org/doc/html/latest/networking/tls.html) — official Linux kernel documentation on kTLS, API, and usage examples
- [Playing with kernel TLS in Linux 4.13 and Go](https://words.filippo.io/playing-with-kernel-tls-in-linux-4-13-and-go/) — one of the first experimental kTLS implementations for Go by Filippo Valsorda (2017), demonstrating an early approach to integrating kTLS with `crypto/tls`
- [HTTP/2 Prioritization with NGINX](https://blog.cloudflare.com/http-2-prioritization-with-nginx/) — how Cloudflare solves HTTP/2 prioritization problems and why it matters for performance
- [The Story of One Latency Spike](https://blog.cloudflare.com/the-story-of-one-latency-spike/) — practical example of performance problem diagnosis: how to find bottlenecks in a system
- [Linux Network Performance Ultimate Guide](https://ntk148v.github.io/posts/linux-network-performance-ultimate-guide/) — complete guide to tuning network performance in Linux: kernel settings, drivers, and system parameters
- [Zero-copy in Linux: sendfile, splice, and vmsplice](https://www.kernel.org/doc/ols/2005/ols2005v1-pages-19-28.pdf) — technical article on zero-copy mechanisms and their application
- [Go pprof: Performance Profiling](https://go.dev/blog/pprof) — official guide on using pprof for profiling Go applications
- [perf: Linux Profiling with Performance Counters](https://perf.wiki.kernel.org/index.php/Main_Page) — documentation on the perf tool for kernel-level profiling
- [TLS 1.3: Full Specification](https://datatracker.ietf.org/doc/html/rfc8446) — RFC 8446 describing the TLS 1.3 protocol, including session resumption and optimizations
- [crypto/tls: support kernel-provided TLS](https://github.com/golang/go/issues/44506) — proposal to add kTLS support to Go's standard library (accepted to Backlog)
- [crypto/tls: slow server-side handshake performance for RSA certificates](https://github.com/golang/go/issues/20058) — known RSA handshake performance issue in Go: detailed analysis of bottlenecks and comparison with OpenSSL
- [kTLS: Minimal Working Example for Go crypto/tls](https://gist.github.com/kshvakov/3ad0017158e790ebb66b70be1e687caf) — simplified implementation for talk presentation, demonstrating main kTLS integration ideas (not used in production, but useful for understanding the concept)

> **Practical Note.** When diagnosing TLS performance problems, first check cipher suite distribution and share of full handshake vs session resumption. Often the problem isn't encryption itself, but the number of handshakes or clients choosing "expensive" ciphers. Source: experience from Cloudflare and other high-load systems.

## Footnotes

[^cdn-background]: For more on how we built our own CDN and why it was necessary, see [Serving Content from HDDs]({{< relref "serving-content-from-hdds.md" >}}).

[^go-gc-problems]: On GC problems in Go when working with large data volumes and in-memory indexes, see [Serving Content from HDDs]({{< relref "serving-content-from-hdds.md" >}}).

[^zero-copy-syscalls]: For more on `sendfile` and `splice` system calls, see [man sendfile(2)](https://man7.org/linux/man-pages/man2/sendfile.2.html) and [man splice(2)](https://man7.org/linux/man-pages/man2/splice.2.html). Technical article on zero-copy mechanisms: [Zero-copy in Linux](https://www.kernel.org/doc/ols/2005/ols2005v1-pages-19-28.pdf).

