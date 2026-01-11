---
title: "Serving Content from HDDs: CDN Edge Evolution from File Chaos to Simple Storage"
date: 2021-09-20
lastmod: 2026-01-08
description: "Practical experience building a CDN on regular HDDs: how to solve the problem of billions of small files, optimize disk operations, and how the system evolved from a complex architecture with merge to a simpler solution without background processes."
tags: ["go", "golang", "cdn", "storage", "performance", "hdd", "zero-copy", "tls", "kinescope", "infrastructure", "delivery", "evolution", "architecture"]
---

When we faced the problem of billions of small files and hit a performance limit at 4 gigabits per server, we had to rethink our approach to storage and serving. This article covers not just how we solved the problem in 2020, but also how the system evolved: from an architecture with merge and complex background processes to a simpler solution that's easier to operate and understand.

{{< youtube id="M5IHpP9AhLg" title="Serving Content from HDDs: Fast, Engaging, and Reliable / Kirill Shvakov" >}}

## TL;DR

- **The problem of billions of small files is solved by packing** — all data is stored in large containers (append-only log), not as separate files in the filesystem
- **Abandoning file deletion** — instead of deletion, a ring buffer (wraparound) with overwrite is used, eliminating fragmentation and load from delete operations
- **HDDs can be effective** — with proper data organization (sequential writes, batch operations), good performance can be achieved
- **Architecture evolution**: from a system with merge and complex background processes (2020) to a simpler architecture without merge, where tiering (RAM/SSD/HDD) is just a placement rule, not a separate pipeline
- **Zero-copy is critical for performance** — using `sendfile` and optimized read paths avoids copying data into user space
- **TLS in Go is slow** — built-in TLS doesn't support zero-copy, so at large traffic volumes this noticeably hurts performance (solution: [kTLS]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}))
- **GC creates problems** — when working with large in-memory indexes (tens of millions of objects), the garbage collector becomes a bottleneck
- **Metrics and profiling are essential** — without them, it's impossible to understand what's happening in the system and where the real problems are

## Introduction: Where the Problem Came From

We work on a content delivery network and video platform. We have our own player, and we can choose which server to serve video from. For a long time, this worked well and scaled—without noticeable problems.

But clients came who wanted to use only CDN—they didn't want to use our other services. So we used them as origin. Origin can be an entire cluster with huge amounts of data.

Problems started when we reached roughly 4 gigabits per server—we crashed, and part of the network serving content to users went down.

### What the Problems Were

The main problem—huge number of files. There were billions on the server. This led to several issues:

- File open cache didn't work—files were constantly opened and closed
- Constant reading from different parts of the disk—highly inefficient
- We constantly wrote and constantly deleted
- The cache that worked didn't help us—how it worked was unclear

We had to do something about it.

## System Requirements

We made a plan of what we wanted from the server. Requirements were fairly simple:

- **Store more than 100 terabytes of data per server** — this was the minimum
- **Content access logic** — signatures, TTL, various limits
- **More metrics than nginx provides** — we needed detailed statistics
- **Cheap logs** — we constantly write a lot of data, wanted to optimize them
- **Store more content information** — metadata we need
- **Scale horizontally** — one server can't store all origin client information
- **Cheap solution** — regular spinning hard drives, no NVMe

We already wrote in Go and knew it well. Build, orchestration, monitoring, and logs were set up—this wasn't a problem. We realized we needed such a server, and then we started dealing with small files.

## Version 1 (2020): Solving the Small Files Problem

The first thing we hit—small files. We had to get rid of them. We started creating several large partitions on disk and putting data inside. Physically, these are two files:

1. **Metadata file** — fixed size: key/identifier, offset, flags (e.g., "deleted"), checksum, etc.
2. **Data file** — "container" where content is written sequentially

Plus we store additional metainformation nearby (including in protobuf), so we don't have to "extract" it from URL/domain and query other systems. This essentially solved the small files problem.

> **Note**: the new system (`cdn/edge`) uses the same idea (containers, metadata), but implementation is simplified: one `data.bin` file per disk instead of separate metadata and data files. Metadata is stored in each object's header, and an in-memory index allows quick lookup.

#### Storage Structure: Containers and Metadata

```text
disk partition
   |
   +-- metadata file (fixed size)
   |      |
   |      +-- key/id -> offset, flags, checksum
   |      +-- key/id -> offset, flags, checksum
   |      +-- ...
   |
   +-- data container (sequential writes)
          |
          +-- object #1 (offset: 0)
          +-- object #2 (offset: N)
          +-- object #3 (offset: M)
          +-- ...
```

Instead of billions of small files in the filesystem—one data container and an in-memory metadata index.

## Version 1 (2020): Working with Disks: Fast and Regular

We introduced two storage classes: **fast** (SSD/NVMe) and **regular** (HDD).

### Shared Write Queue

We have a shared write queue. Each disk has its own worker (goroutine): whoever is free takes the next task and writes to disk. This makes writes more even and predictable.

```text
write requests
   |
   v
shared queue
   |
   +---> worker (disk 1) --> HDD #1
   +---> worker (disk 2) --> HDD #2
   +---> worker (disk 3) --> HDD #3
   +---> ...
```

Each worker takes the next task from the shared queue and writes sequentially to its disk.

### Heuristic for Small and Large Files

We have a simple heuristic: "large" objects go straight to HDD (threshold around ~225 MB), while small stuff goes to SSD first.

SSD is more expensive, and with huge numbers of small objects/operations, problems start there too—especially on random I/O.

### Merge: Gluing Files (Version 1)

Those "small" ones are often chunks of the same video (fragments). If left as-is, we get lots of random reads and access degradation.

What we did in version 1: periodically "glued" (merge) these chunks into sequential segments. For this, we collected statistics: where a chunk is, which disk, which container—and tried to arrange order so reads/writes would be maximally sequential.

If some video started being actively watched, we took the corresponding fragments, ordered them, and rewrote to HDD "as a normal file"—one sequential chunk.

As a result, we significantly (roughly an order of magnitude) reduced random I/O on disks.

> **Important**: in the new system (`cdn/edge`), merge is removed. Instead, tiering works as a placement rule on write: small objects are written to SSD immediately (if available), not rewritten later. This simplifies architecture and makes behavior more predictable.

#### Before and After Merge

```text
Before merge (random I/O):
SSD: [chunk1] ... [chunk5] ... [chunk3] ... [chunk7]
     |          |          |          |
     +---> random reads during playback

After merge (sequential I/O):
HDD: [chunk1][chunk3][chunk5][chunk7] (sequential)
     |                                |
     +---> sequential read, faster and cheaper
```

## Ring Buffer: Abandoning File Deletion

A separate pain—deletion. In "classic" schemes (e.g., nginx as proxy-cache), there's constant churn: something written, something evicted, something deleted. This also creates disk load.

We went a different way: **we don't delete files at all**. There are partitions (containers) on disk, and when space runs out, we simply shift the write pointer to the start and begin overwriting in a circle—essentially, a ring buffer (wraparound).

This approach has two nice effects:

1. **Our offset is fixed** — physically files remain, so we don't lose them
2. **We keep reading until we overwrite them** — so it doesn't happen that when we free space, data immediately becomes unavailable

> **Note**: this approach is preserved in the new system (`cdn/edge`). Wraparound works at the level of one `data.bin` file—when the file fills, the write pointer shifts to the start, and overwriting old data begins. This eliminates fragmentation and load from delete operations.

#### Ring Buffer Instead of Deletion

```text
container (fixed size)
   |
   +-- [old data] [old data] [old data]
   |      |                              |
   |      +-- read pointer (can read)
   |                                        |
   +-- write pointer (overwrite from start)
        |
        +-- [new data] [new data] ...
```

Instead of delete operations—just overwrite in a circle. Fragmentation doesn't occur because data isn't physically deleted.

With disks, everything works fine.

## Serving Content (Both Versions)

The file still needs to be served. Simplified scheme: there's the internet, a request comes to us via DNS, reaches our server, and it serves it.

We use HTTP/1.1—for serving video in our case, it fits perfectly and is simple enough[^http-1-1-choice]. So we wrote our own web server and integrated it with disk storage.

> **Note**: in the new system (`cdn/edge`), content serving works on the same principle, but with optimizations: zero-copy via `SendFile`/`ReadFrom`, automatic compression for storage and decompression on conditions, HTTP Range request support for streaming.

### Data Sharding

Since we can't fit all client content on one server, data is **sharded**.

Important: the description below reflects the **current setup**. In the earlier version (v1), a request could land on any edge, and that edge would proxy to the “correct” server. Today it’s organized differently.

#### Edge proxy: how we pick the “right” server

Requests that should be sharded (by domain) do **not** go directly to an edge. DNS points those domains to a **proxy IP**. The proxy terminates HTTPS, reads the HTTP/1.1 request, and selects a target edge via consistent hashing.

- **Sharding key**: `Host + dirname(path)`. This is intentionally not the full URL: it helps keep structurally related requests on the same shard and reduces unnecessary cross-node traffic.
- **Degradation**: if the chosen upstream edge is unhealthy / can’t be dialed, it’s marked “off” for a short time (a few seconds) and the request goes through a fallback path (e.g., backend / another upstream).
- **Connection pools**: to avoid paying the `dial` cost per request, we keep a small keep-alive pool per upstream and reuse connections.
- **Metrics**: upstream latency and sent bytes per upstream address, plus connection stats (reuse/open/error/bad).

For most requests, proxying is not used: we **route clients directly to specific edge IPs**, so there’s no extra “edge → edge” hop.

#### How Sharding Works

```text
client request
   |
   v
DNS
   |
   +---> sharded domains -> proxy IP
   |         |
   |         +---> proxy: build key = Host + dirname(path)
   |         |
   |         +---> consistent hash -> target edge
   |         |
   |         +---> proxy forwards request -> edge serves response
   |
   +---> non-sharded domains -> specific edge IPs
             |
             +---> edge serves response
```

In short: for sharded domains the entry point is the proxy (it does the hashing). For non-sharded domains we try to send clients straight to specific edge addresses without proxying.

### File Access

Here's how it works internally: a request comes, we quickly do a lookup by index (where the object is, what offset, etc.), then read data from the container.

We keep the index in memory (loaded at startup). On reads, we use regular `read` in several places—there's still room to polish toward the "ideal" option.

#### Request Path: From Client to Disk

```text
HTTP request
   |
   v
parse URL -> build key
   |
   v
in-memory index lookup
   |      |
   |      +---> object metadata (offset, size, disk, container)
   |
   v
open container file
   |
   v
seek to offset
   |
   v
read data (size bytes)
   |
   v
send to client (HTTP response)
```

The in-memory index allows quickly finding where an object is without filesystem access.

### Caching

In version 1, we did keep an explicit in-memory cache on each edge (LRU, tens of gigabytes) — otherwise, “raw” disk reads would quickly run into latency limits.

In the current implementation (`cdn/edge`), there’s no separate “cache as a component”: we keep some data in memory based on a heuristic (described in the article), and overall the **OS page cache** does a great job — and in practice it works.

## What We Got: Version Comparison

### Version 1 (2020): System with Merge

Typical server configuration: 32 cores, about 195 GB RAM, and two network adapters.

The system worked and handled load, but:
- Merge created periodic load spikes
- Operational costs for supporting merge were high
- System behavior was less predictable due to background processes

Historically (at that stage), we had many SSDs “with margin,” but over time we found they could be used less: SSDs accounted for about 20% of reads, the rest—HDD.

As of 2025, the SSD/HDD price gap is no longer as dramatic, and with the optimizations in the new edge implementation we’re gradually pushing HDD out. Our typical setup now is **2/3 HDD and 1/3 SSD**, and the SSD share will grow — it’s become economically advantageous (more traffic per unit).

Load varies by time and clients, but overall everything works. Sometimes we hit roughly 50 Gbps per server—beyond that, the network sets limits, not the disk.

### Version 2 (New System): Without Merge

The new system (`cdn/edge`) preserved performance but became simpler:

- **No merge** — tiering works as a placement rule, without background processes
- **More predictable behavior** — no periodic spikes from rewrites
- **Easier operations** — fewer components to configure and debug
- **Same performance** — system handles the same loads, but more stable

**What remained complex**:

- GC still creates problems with large indexes (tens of millions of objects)
- TLS requires optimizations (kTLS) to achieve maximum performance
- Monitoring and metrics are critical—without them, it's impossible to understand what's happening in the system

## Version 1 (2020): Gotchas and Reality Pressure

After building the first version with containers, merge, and ring buffer, it worked, but over time problems accumulated that made us rethink the architecture.

### Problem Number One: TLS

We write a lot in Go and know it well. But on this task, Go created problems in places.

The first problem we hit—TLS. Nowadays, almost all traffic is encrypted, rarely do you see unencrypted traffic. So we need to handle TLS requests.

Go has built-in TLS—it has an excellent API that suits us: we can change certificates on the fly, even without stopping the server. But performance-wise, it's not very fast.

> **Practical Note.** Built-in TLS in Go (`crypto/tls`) is convenient API-wise, but at large traffic volumes can become a bottleneck due to lack of zero-copy support and overhead from copying data. For high-load systems, consider kTLS or TLS termination at the proxy level (e.g., nginx or specialized solutions). Source: experience serving hundreds of gigabits of traffic through Go services.

We started looking at what could terminate TLS. **Hitch** (Varnish project) does one thing—accepts TLS, decrypts, and forwards (to TCP or Unix socket).

Next, an important detail about proxying: if between two connections we can use `splice`, data almost doesn't enter user space—and this saves CPU/memory significantly[^zero-copy-splice].

But if we hit classic `read`/`write` (e.g., on Unix socket), data starts moving through user space—and this is noticeably more expensive.

A separate hope—**kTLS**: the kernel can take on part of TLS work. In Linux, this appeared relatively recently (around 5.3), and this potentially can noticeably speed up termination[^ktls-details]. For more on how we solved this problem, see [Speeding Up Go TLS to 100 Gbps]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}).

### Problem Number Two: Garbage Collector

The second problem—GC. In Go, the garbage collector is generally good, but at very large volumes of objects in memory, it becomes a factor.

When we built the index, we first "smartly" made a tree.

When we reached tens of millions of files per server (around 50–80 million), it became visible that a significant part of CPU goes to GC work.

Ultimately, the most practical solution turned out simple: switch to a regular `map`. Yes, it's more expensive memory-wise, but noticeably reduces CPU load.

Due to GC, we can't infinitely "stuff" memory with small objects for cache: at some point, GC starts dominating.

Another effect: due to overhead from Go's memory model, we on average spend noticeably more RAM than we'd like. As a result, **page cache** suffers—and in Linux, this is very useful for speeding up reads. This is also related to us not having `O_DIRECT`.

### Problem Number Three: Load Prediction

The third problem—prediction and preloading.

As I already said, part of the logic is moved to a separate server with controllers that collect statistics and suggest what to warm in cache.

In theory, everything looked logical: there's data—so we can predict what a user will watch and put it in memory ahead of time.

In practice, this works worse than we'd like: guessing user behavior from one or two events is a difficult task.

As a result, we often load more data into memory than actually needed, and some of it isn't used later.

It's clear this part needs redoing—and there are plans for it.

### Problem Number Four: Merge Complexity

We have a merge phase when we collect chunks into larger segments based on statistics. This is all good, but we need to accumulate a sufficiently large time window to understand what's worth gluing. Usually, this process runs once every few hours—and it's long.

Plus merge itself creates a large volume of rewrites. We "stretch" it over time, but still at that moment the disk is noticeably loaded—and this is visible in metrics (e.g., iowait). When merge runs, this creates competition for disk resources with regular read requests, which can lead to latency degradation.

**Operational costs**: merge is a "background process" that needs monitoring, configuration, debugging. If it breaks or works differently than expected, this isn't always obvious immediately. Plus merge requires accumulating statistics and making decisions about what to glue—this is additional complexity.

## Evolution: What We Wanted to Improve

After a year of operating version 1, we realized the architecture needed simplification. Main goals:

1. **Remove "background magic"** — fewer processes that work "on their own" and affect performance unpredictably
2. **Make behavior more predictable** — if the system works, it should work stably, without periodic load spikes from merge
3. **Simplify operations** — fewer components to configure and debug
4. **Preserve performance** — simplification shouldn't mean degradation

**Key decision**: abandon merge as a separate process. Instead, make tiering (RAM/SSD/HDD) a simple placement rule at write time, without subsequent rewrites.

## Version 2 (New System): `cdn/edge` Without Merge

The new system (`cdn/edge`) is built on the same principles (containers, ring buffer, index), but architecture became simpler and more modular. Main difference: **no merge as a background process**—tiering works as a placement rule on write.

### Modular Architecture

The system consists of several independent modules:

```text
HTTP Server (server/)
   |
   +---> Pull Zone Manager (pullzone/)
   |        |
   |        +---> JWT/SecureLink check
   |        +---> Firewall (IP blocking)
   |        +---> Cache key generation
   |
   +---> Storage Engine (storage/)
   |        |
   |        +---> Index (index/) - mmap table
   |        +---> Disk (disk/) - append-only log
   |
   +---> Download Manager (download/)
   |        |
   |        +---> Fetch from origin
   |        +---> Locks (prevent duplication)
   |        +---> Async processing of large files
   |
   +---> Manager Client (manager/)
            |
            +---> Configuration sync
```

Each module handles its area and can evolve independently.

### Request Path: From Client to Disk

When an HTTP request comes, the system processes it along the following path:

```text
HTTP Request
   |
   v
[1] Domain check (excluded hosts)
   |
   v
[2] Find Pull Zone by Host header
   |
   v
[3] Firewall check (IP blocking)
   |
   v
[4] Access check (JWT/SecureLink)
   |
   v
[5] Cache key generation (zone + URL + query params)
   |
   v
[6] Storage lookup (index search)
   |
   +---> HIT? --> [7a] Send to client (zero-copy)
   |
   +---> MISS? --> [7b] Download Lock (prevent duplication)
                    |
                    v
                    [8] Exists check (double-check)
                    |
                    +---> exists? --> [7a]
                    |
                    +---> no? --> [9] Fetch from origin
                                   |
                                   v
                                   [10] Store in Storage
                                   |
                                   v
                                   [11] Send to client
```

**Important details**:

- **Download Lock**: if multiple requests come simultaneously for one object, only one goes to origin, others wait and get result from cache
- **Double-check**: between lock and fetch, an `Exists` check is done to avoid loading an object that already appeared
- **Async processing**: large files (>200 MB) or chunked content are processed asynchronously—client gets response immediately, disk write happens in background

### Disk Storage: Append-Only Log with Wraparound

Each disk is represented by one `data.bin` file—an append-only log where objects are written sequentially. At the start of the file, a pointer to the current write position is stored (8 bytes).

**On-disk record structure**:

```text
data.bin (fixed size = disk size)
   |
   +-- [offset pointer] (8 bytes at file start)
   |
   +-- [header #1][content #1]
   |      |           |
   |      |           +-- object data (possibly gzip compressed)
   |      |
   |      +-- metadata (protobuf):
   |            - object key
   |            - header and content size
   |            - content type
   |            - flags (compression, TTL, workspace ID, zone ID)
   |
   +-- [header #2][content #2]
   |
   +-- [header #3][content #3]
   |
   +-- ...
   |
   +-- [wraparound] when space runs out, pointer
        |            shifts to start (offsetLen = 8)
        |
        +-- overwrite old data in circle
```

**Wraparound (ring buffer)**:

When the file fills, the write pointer shifts to the start (after first 8 bytes), and overwriting old data begins. This works as a ring buffer:

```text
Before wraparound:
data.bin: [offset=1000] [obj1] [obj2] [obj3] ... [objN] [free]
           ^            ^                              ^
           |            |                              |
           |            +-- write pointer              +-- end of file

After wraparound (file full):
data.bin: [offset=8] [obj1] [obj2] ... [objN] [objN+1] [objN+2] ...
           ^         ^                              ^
           |         |                              |
           |         +-- write pointer (overwrite)  +-- old data
           |
           +-- pointer reset to start
```

**Why this works**:

- Old objects can be read until overwritten
- No delete operations—only overwrite
- No fragmentation—data is always sequential
- Simplicity: one file, one pointer, one logic

**Object write**:

1. Read current offset from file start
2. Check if there's space (if not—wraparound)
3. Write header (metadata in protobuf)
4. Write content (possibly gzip compressed if size >1 KB and type fits)
5. Update offset at file start
6. Add entry to index

Write goes through a buffered writer (2 MB buffer) for efficiency.

### Index: mmap Table with Wraparound

The index is stored in memory via `mmap` and allows quickly finding an object by key. Structure: **main index** (for large objects >5 MB) + **10 chunks** (for small objects).

**Index structure**:

```text
Index
   |
   +-- main.idx (mmap, ~2M entries)
   |      |
   |      +-- [pos counter] (4 bytes)
   |      |
   |      +-- [item #1] [item #2] ... [item #N]
   |            |
   |            +-- Key (8 bytes)
   |            +-- Meta (15 bytes):
   |                  - Disk ID (1 byte)
   |                  - Offset (8 bytes)
   |                  - HeaderSize (2 bytes)
   |                  - ContentSize (4 bytes)
   |            +-- Zone (2 bytes)
   |            +-- Deleted flag (1 byte)
   |            +-- Checksum (4 bytes)
   |
   +-- chunks/ (10 files, mmap, ~3.5M entries each)
          |
          +-- chunk_1.idx
          +-- chunk_2.idx
          +-- ...
          +-- chunk_10.idx
```

**Index selection**: for an object with key `K`, `chunk = K % 10` is chosen. Large objects (>5 MB) always go to main index.

**Wraparound in index**:

Like on disk, the index uses wraparound. When position reaches maximum, it resets to start, and old entries are overwritten:

```text
Before wraparound:
main.idx: [pos=1000] [item1] [item2] ... [item1000] [empty]
           ^         ^                              ^
           |         |                              |
           |         +-- current position           +-- end of file

After wraparound:
main.idx: [pos=1] [item1] [item2] ... [item1000] [item1001] ...
           ^      ^                              ^
           |      |                              |
           |      +-- new position (overwrite)  +-- old data
           |
           +-- position reset
```

**Index operations**:

- **Lookup**: search by `map[Key]uint32` (position in mmap), then read structure from mmap
- **Upsert**: if key exists—update in place, if not—write to current position and increment counter
- **Delete**: set `deleted=1` flag (physically entry remains, but ignored on lookup)

**Why mmap**:

- Fast data access (without system calls for reads)
- Automatic disk sync (MAP_SHARED)
- Efficient memory use (OS page cache)

### Tiering Without Merge: Placement Rule

In the new system, tiering (RAM/SSD/HDD) works as a **placement rule on write**, not as a separate merge process.

**Placement rules**:

```text
Object arrives for write
   |
   v
[1] Preview content (< 2 days)?
   |
   +---> yes --> RAM (if available)
   |
   +---> no --> [2] Audio/Poster?
                 |
                 +---> yes --> SSD (if available)
                 |
                 +---> no --> [3] Video (< 30 days)?
                                |
                                +---> yes --> SSD (if available)
                                |
                                +---> no --> HDD
```

**Important**: this is a **rule**, not a process. The object is written to the needed disk immediately and stays there until TTL expires or overwrite via wraparound. There's no separate process that would rewrite data from SSD to HDD.

**What this gives**:

- **Simplicity**: no background processes to configure and debug
- **Predictability**: system behavior doesn't depend on merge work
- **Less load**: no periodic spikes from rewrites
- **Easier operations**: fewer components that can break

### Integrity Check and TTL

Checks happen on the read path and via control operations:

1. **Integrity check on read**: when an object is accessed, we verify its integrity (magic sum, checksum)
2. **TTL check**: on read, `ExpiresIn` is checked—if object expired, it's removed from index
3. **Zone purge**: separate process removes objects by zone (e.g., when zone is deleted or on schedule)

**Purge thread**:

```text
Purge Thread (every minute)
   |
   v
[1] Get list of zones for deletion (from Manager)
   |
   v
[2] Traverse index, find all zone objects
   |
   v
[3] Check TTL/deletion conditions
   |
   v
[4] Delete from index (set deleted flag)
   |
   v
[5] Object physically remains on disk until overwrite
```

Physically, objects aren't deleted—they remain on disk until overwrite via wraparound. This simplifies logic and eliminates fragmentation.

### Performance: Where We Save

**Zero-copy on serve**: the system uses an optimized path for sending data to clients. If the object isn't compressed or the client supports gzip, data is sent via `SendFile`/`ReadFrom`, avoiding copying into user space.

**Compression for storage**: objects >1 KB and suitable type are automatically gzip compressed on disk write. On read, if the client supports gzip, data is served compressed; if not—decompressed on the fly.

**Open file pool**: for reads, a pool of open file descriptors is used (up to 50 per disk), reducing overhead from opening/closing files.

**Why "fewer background processes" = more predictability**: when there's no merge that periodically creates load spikes, system behavior becomes more stable. Easier to plan capacity, simpler to diagnose problems, fewer unexpected degradations.

## What to Read

What to read:

- ScyllaDB articles on data access and disk work in Linux (including `mmap` and its trade-offs);
- Cloudflare articles on networking and high-load systems;
- Materials on zero-copy in Linux (`splice`, `sendfile`) and modern variants based on BPF/socket layer.

Separate author conclusion: "check everything manually"—benchmarks and promises "everything flies" often don't survive meeting real load.

## Q&A

### On HDD Work and Request Queue

**Question**: HDDs have a limit on parallel reads: if you "overdo it," latency spikes sharply. Do you limit this somehow (heuristic/dynamics) or rely on cache/layout?

**Answer**: There's no separate "smart" heuristic at the disk level: much is covered by cache and how we lay out data.

By content profile, roughly 70% is what's watched daily (conditionally "warm/hot"), and it will be regularly requested anyway. A classic TTL cache "for a day" works poorly for such a profile, so we keep a significant volume of data in memory (DRAM) and practically don't evict what stays in demand long.

For reads, there's an intermediate cache in memory plus OS page cache helps us a lot. HDD itself in "pure" form serves on the order of hundreds of megabytes per second (i.e., less than 1 Gbps), but thanks to caches and sequential access, in practice you can see larger numbers.

Layout also helps: we try to put chunks of one file on the same disk. Then on a load spike, usually one disk "burns" (it handles it), and other requests distribute across others. The scenario "too much hot on one disk" happens rarely—"so far lucky."

**Question**: So "lucky" is also layout logic?

**Answer**: Yes: we try to put parts of one file on one disk. This increases the chance that in the moment it won't happen that one disk becomes a concentration point for many popular videos at once.

### On Partition Sizes and Storage Structure

**Question**: Did I understand correctly: you "pack" small files into large containers? Fixed-size container?

**Answer**: In version 1 — yes, size is fixed: partitions are created at disk initialization. Metadata is fixed size (order of hundreds of megabytes, e.g., ~200 MB), because entries there are fixed structure.

Partitions themselves then came from splitting the disk into equal parts (into 50; this decision later wanted revisiting). At volumes around 100+ TB, “large” containers still ended up very many.

In the new version there are no partitions: **one disk — one file** (an append-only log, e.g. `data.bin`), and wraparound/indexing is built around that.

We consciously don't try to "divide the world" into "small files" and "large files" at the API level—everything is stored the same. But inside the pipeline, there's a rule: small chunks first go to SSD. If you write them to HDD "as-is," random I/O quickly kills performance.

Key thought: **the trick isn't just putting in a container**, but preserving/restoring order and reading/writing sequentially. In version 1, merge and layout were important for this. In the new system, order is preserved through placement rules on write (tiering), without needing a separate merge process.

### On Filesystem and RAID

**Question**: Why did you move away from nginx toward a custom solution—functionality or performance?

**Answer**: The problem wasn't only (and not so much) in the HTTP part. We needed to provide the required storage model on disk and our own content access logic (signatures, TTL, limits, metadata)—and it was simpler to build this as a unified solution.

Plus we "naively" expected built-in TLS in Go would carry us. It's convenient API-wise (e.g., can change certificates on the fly), but performance-wise in our task it became a bottleneck.

**Question**: Do you use RAID?

**Answer**: We don't use RAID.

### On "Lucky" and Statistics

**Question**: Do you have statistics "how often lucky / unlucky," and what happens in moments when "unlucky"?

**Answer**: We don't have a direct "lucky/unlucky" metric. Usually, this looks like degradation, not complete failure: there are many servers, and the system can redistribute.

If a client "eats" bandwidth on an edge group, in extreme cases you can abandon sharding and temporarily serve data more widely to smooth the peak.

Much depends on read/write balance. Reading from disk can be fast, but simultaneously writing fast to the same place—already much harder. So we're looking toward more native/async I/O. And yes: when active writes start (merge, recovery after failures), serving can slightly slow—but current latency is still better than "before, before all optimizations."

### On Moving to Rust

**Question**: You mentioned wanting to replace Go with Rust. Did you end up switching?

**Answer**: No, we didn't switch to Rust. Ultimately, all problems were solved using Go.

If choosing a language "for every day," I often choose Go—it's simpler and gives results faster. Rust is more complex and requires more effort.

Initially, we considered moving to Rust due to wanting strict memory control and no GC, plus ability to go deeper into native I/O (including io_uring for TCP and files). We tried benchmarks and different approaches, but due to high request concurrency and large traffic volumes, solutions that look good "on paper" don't always win in reality—overhead from interaction appears.

**What helped solve problems on Go**:

- **kTLS** — kernel TLS integration allowed solving TLS performance problems and restoring zero-copy on serve (for more, see [Speeding Up Go TLS to 100 Gbps]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}))
- **Architecture simplification** — abandoning merge and other complex background processes made the system more predictable and reduced GC load
- **Index optimization** — moving to mmap and simple data structures reduced GC pressure

Ultimately, Go proved sufficient for solving all tasks, and moving to Rust wasn't needed.

### On Sharding and Fault Tolerance

**Question**: How is sharding set up? What happens on disk/server failure?

**Answer**: Sharding is custom. We use consistent hashing to choose the "correct" server for an object.

If a disk breaks, this looks like cache miss and degradation. If "lucky," there was little in-demand content on the disk—impact is minimal. If "unlucky," warm/hot content could be there—then load redistributes, and degradation is more noticeable.

When we lose a disk, writes can spike sharply (recovery/redistribution)—this causes degradation. Similarly on server failure: for some time we try to "push" the connection, but quickly give up and rebuild on remaining nodes.

### On Fragmentation

**Question**: Is fragmentation on overwriting "deleted" data a problem?

**Answer**: We don't see it yet. We periodically check manually and take separate metrics, but admit: we don't monitor everything, so we continue observing.

## Checklist: How to Build Something Similar

If you want to build a similar system, here's a practical checklist:

### Metrics and Monitoring

**Required metrics**:

- **Disks**: iowait, throughput (read/write), latency (p50/p95/p99), free space
- **Index**: entry count, misses (index miss), operations (lookup/upsert/delete)
- **Requests**: RPS, latency (p50/p95/p99), cache hit rate, errors by type
- **Memory**: heap usage, GC pauses, index size in memory
- **Network**: throughput, drops, TCP connections

**What to look for in profiles**:

- **pprof CPU**: where time is spent (GC, copying, system calls)
- **pprof heap**: large allocations, memory leaks
- **perf**: system calls, copying (`copy_user_*`, `memcpy*`), network stack

### Data Invariants

**What to check**:

- Index and disk are synchronized (object in index exists on disk)
- Wraparound works correctly (offset doesn't go beyond file bounds)
- TTL is checked on read (expired objects are removed from index)
- Checksum is valid (integrity is checked on read)

### Typical Degradations and How to Diagnose

**Problem**: high iowait, latency degradation

**Diagnosis**:
- Check if background process is running (merge, integrity check)
- Look at read/write distribution across disks
- Check if any disk is overflowing

**Problem**: index miss growth

**Diagnosis**:
- Check index wraparound (possibly old entries are overwritten)
- Check index and disk synchronization
- Look at key distribution across chunks (possibly one chunk is overflowing)

**Problem**: memory usage growth

**Diagnosis**:
- Check index size (how many entries in memory)
- Look at GC profile (possibly GC isn't coping)
- Check memory leaks (heap growth without load growth)

**Problem**: TLS performance degradation

**Diagnosis**:
- Check CPU profile (how much time goes to `crypto/tls`)
- Check if kTLS is used (see [kTLS article]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}))
- Look at handshake metrics (count, time)

### Testing for Degradations

**What to test**:

- **Disk overflow**: what happens when disk fills and wraparound begins
- **Index overflow**: what happens when index fills and wraparound begins
- **Disk loss**: how system behaves on disk failure
- **High load**: how system behaves at peak loads (hundreds of gigabits)
- **Read/write competition**: what happens when there's lots of reading and writing simultaneously

## Conclusion

We work with HDDs, and to "beat" them, we had to do extensive research, experiment, and consult with people. The system evolved from a complex architecture with merge to a simpler solution that's easier to operate and understand.

Main takeaways from our experience:

- **The problem of billions of small files can be solved** — packing into large containers (append-only log) with metadata works effectively
- **HDDs can be effective** — with proper data organization and sequential writes, good performance can be achieved
- **Simplicity matters more than complexity** — abandoning merge simplified the system and made its behavior more predictable
- **Go has limitations** — especially in memory work and TLS, but for many tasks it fits excellently
- **Metrics are critical** — without them, it's impossible to understand what's happening in the system and where real problems are
- **Limitations help** — they force thinking about correct architecture and not implementing unnecessary things

If we managed—you can too. Usually, the most unpleasant problems turn out quite basic: data must be **sorted** so you can search quickly; structures—**fixed size** so you can efficiently store them on disk/in memory and retrieve quickly.

Any solution must be justified—you need to understand what exactly you're doing and why. Unsolvable tasks are almost nonexistent: the question is price and time. Sometimes it's not "a day of work," but a month or even a year—and this is normal if value is sufficiently high.

**System evolution** showed that simplification often beats complexity. Abandoning merge not only simplified code but made the system more stable and predictable. Less "background magic"—more control and understanding of what's happening.

Metrics regularly save us: when there are many and they're correct, "issues" are visible quickly. In Go, profiling is also good—it really helps.

And last: "everyone lies." In articles, talks, and benchmarks, there's often untruth—sometimes from start to finish. So everything needs checking under your load: you can't just "install and go"—issues will surface anyway.

Almost always, reality will differ from description. And experience here is understanding that implementing any new thing, you can quite shoot yourself in the foot—and then still have to figure out and fix. But this is normal—this is how systems evolve.

## Useful Resources

- [Zero-copy in Linux: sendfile and splice](https://www.kernel.org/doc/ols/2005/ols2005v1-pages-19-28.pdf) — technical article on zero-copy mechanisms and their application for serving files
- [Linux Network Performance Ultimate Guide](https://ntk148v.github.io/posts/linux-network-performance-ultimate-guide/) — complete guide to tuning network performance: kernel settings, TCP, buffers, and drivers
- [ScyllaDB: Working with Disks in Linux](https://www.scylladb.com/2016/09/15/io-access-methods-scylla/) — practical tips on disk work, mmap and its trade-offs from the ScyllaDB team
- [HTTP/2 Prioritization with NGINX](https://blog.cloudflare.com/http-2-prioritization-with-nginx/) — how Cloudflare solves HTTP/2 prioritization problems and optimizes content serving
- [The Story of One Latency Spike](https://blog.cloudflare.com/the-story-of-one-latency-spike/) — practical example of performance problem diagnosis: how to find bottlenecks in a CDN
- [Go pprof: Performance Profiling](https://go.dev/blog/pprof) — official guide on using pprof for profiling Go applications
- [Working with Memory in Go: GC and Optimizations](https://go.dev/doc/gc-guide) — guide to understanding garbage collector work and optimizing memory usage
- [Page Cache in Linux: How It Works](https://www.kernel.org/doc/html/latest/admin-guide/mm/page_migration.html) — documentation on page cache and its effect on I/O performance
- [HDD vs SSD: When to Use What](https://www.backblaze.com/blog/hdd-vs-ssd/) — practical comparison of HDD and SSD for different usage scenarios
- [kTLS: Kernel TLS for Linux](https://www.kernel.org/doc/html/latest/networking/tls.html) — documentation on kTLS, which helps solve TLS performance problems in Go
- [Speeding Up Go TLS to 100 Gbps]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}) — detailed breakdown of kTLS integration in Go for achieving high HTTPS serving speeds

> **Practical Note.** When working with large volumes of small files (billions of objects), classic filesystems quickly become a bottleneck. Solution via packing into containers (append-only log) with fixed metadata and in-memory index avoids problems with open file cache and fragmentation. Source: experience building a CDN on HDDs and system evolution from version with merge to simpler architecture without background processes.

## Footnotes

[^ktls-details]: For more on kTLS, how it works and how to use it in Go to achieve high speeds, see [Speeding Up Go TLS to 100 Gbps]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}).

[^zero-copy-splice]: On zero-copy mechanisms (`sendfile`, `splice`) and their application for serving content, see [Speeding Up Go TLS to 100 Gbps]({{< relref "speeding-up-go-tls-to-100-gbps.md" >}}).

[^http-1-1-choice]: HTTP/1.1 for serving video is often preferable to HTTP/2 because it doesn't require multiplexing and stream prioritization. For large files, HTTP/1.1 simplicity can be an advantage. For more on protocol choice, see [HTTP/2 Prioritization with NGINX](https://blog.cloudflare.com/http-2-prioritization-with-nginx/).

