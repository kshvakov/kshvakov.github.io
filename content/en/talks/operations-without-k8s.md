---
title: "Operations Without K8s"
date: 2022-06-14
lastmod: 2026-01-07
description: "Practical experience operating production infrastructure without Kubernetes: how we moved away from K8s and built a simple, reliable, and efficient system based on systemd and package managers."
tags: ["kubernetes", "devops", "infrastructure", "systemd", "ansible", "operations", "kinescope"]
---

I'll share our experience operating production infrastructure without Kubernetes at Kinescope. We moved away from K8s about three years ago and built a simple, reliable, and efficient system based on standard Linux tools: systemd, package managers, and Ansible.

This article describes the reasons for moving away from Kubernetes, system requirements, solution choices, and practical experience operating more than 50 servers across 4 data centers with one administrator.

{{< youtube id="e50e5CjsKlU" title="Operations Without K8s / Kirill Shvakov, Kinescope" >}}

## TL;DR

Key takeaways from our experience operating without Kubernetes:

- **Simplicity over complexity** — standard Linux tools (systemd, package managers) solve most tasks without additional abstraction layers
- **One binary — one service** — all services are built into a single binary file, simplifying delivery and operations
- **Automation via Ansible** — all infrastructure is described as code, developers don't depend on admins
- **Scaling via server groups** — simple horizontal scaling without orchestrators
- **Fault tolerance via DNS and BGP** — traffic routing at the network level, not application level
- **Fewer components — fewer problems** — in three years, nothing has failed due to systemd or package managers

## Context: What Was and What Became

We currently don't have Kubernetes or Docker in production. They existed before, but we didn't specifically remove them — the transition happened naturally. We have one admin, one DevOps engineer, operate in 4 data centers (two in Russia, one in Europe, one in the US, and we're planning in Asia), and run a bit more than 50 servers.

A long time ago we had Kubernetes, and we've been operating without it for about three years (maybe a bit less). It ran, consumed resources, sometimes broke, and we didn't understand what broke. Everything seemed to work, but fixing it was often very difficult — an admin handled it. We even had two admins back then.

I really **didn't** like what was happening because there was no control. Having two data centers meant several Kubernetes clusters, which created additional complexity.

We didn't want to give up anything, but we wanted more stability in the system.

## What We Wanted from the System

Before solving problems with Kubernetes as such, we wanted to ask: what do we actually want from our systems?

### Operations Requirements

An engineer who handles operations is not a developer. They don't know what's in a service, and they don't need to know what the service does or how it works. We have about 40 services, maybe more.

Operations wanted a service to:

- Expose some ports externally (if it works over HTTP — that's not so important)
- Have a metrics port (mandatory)
- Store parameters via environment variables (all configs should be via environment variables, so there are no config files if possible)
- Not differ much from other services (why use many different services that are configured and operated differently — this will be complex, expensive, and inefficient)

### Development Requirements

Development, naturally, wanted:

- Not to depend on operations — not to be in a hostage situation
- Not to ask to add a service or deploy somewhere
- Not to beg for logs, monitoring, and everything else — common everyday problems that remain problems for some

### General Requirements

What we wanted from the system overall:

- **Automation** — it existed, but we wanted more
- **Scaling** — the system should scale
- **Fault tolerance** — the system should be fault-tolerant
- **Unified package format and delivery** — this is important: we deploy every day, sometimes 10–20 releases
- **Service persistence** — we want to build a service in exactly the same state, test it, and then deploy to production
- **Resource isolation** — more than one service can run on one machine
- **Security** — this is important
- **Performance** — we had performance problems with Kubernetes, it broke, this was expensive in terms of hardware

## Solution: One Binary — One Service

We took a slightly different path: instead of building a platform for services that could do anything, we brought the services themselves to the needed state.

### Service Requirements

One service should be one binary with standard metrics and everything else. We had services written in Ruby — "one service — one binary" didn't fit them. We rewrote the remaining Ruby services in Go[^go-choice] so they could be built as binaries.

We build not only traditional services. For example, we have a player (JS files), a website, and an admin panel — we pack all of these into one binary together with static assets. From an operations perspective, everything is the same — whether it's a player, API, or DNS server, they're all treated identically for operations and delivery.

### Unified Metrics Format

Metrics should be standardized, but there should always be at least one that describes the application: version, build time, and name. This way we always see it.

Ultimately, all services became the same — they don't differ at all from an operations perspective. We ended up with one binary, which made operations much easier.

## Why Not Docker?

The benefits go beyond being able to run a binary manually. We need to deliver and start services. For this, many say Docker is needed: because Docker is convenient, Docker "packages," Docker has resource isolation and other capabilities.

But Docker has overhead. Plus networking and diagnostics become more complicated. We needed a proven and reliable solution, and Docker didn't fit: not that there were specific problems, but it's too large, unnecessary, and adds performance overhead.

## Solution: Package Manager and systemd

To deliver something reliably and start it, everything needed is in the operating system. We run Linux (Ubuntu everywhere), and like any operating system, it has a package manager (apt in our case) and systemd, which manages applications.

These tools are mature, reliable, and proven. No additional systems need to be installed — we avoid extra complexity and have fewer parts that can fail. This is a significant advantage.

> **Practical Note.** systemd and package managers are standard Linux tools that are time-tested and used everywhere. Their advantage isn't just reliability, but also that any Linux administrator knows how to work with them. This lowers the barrier to entry for new team members and simplifies problem diagnostics. Source: experience operating more than 50 servers without Kubernetes.

The package manager doesn't have to be apt: it could be yum or any other, depending on your operating system. We use Ubuntu, so apt. Overall there's no difference.

#### Delivery Process: From Build to Launch

The full delivery pipeline looks like this:

```text
[1] Development
    |
    v
[2] Build (go build)
    |
    v
[3] Create package (kinectl deb)
    |    |
    |    +---> Read spec.yml
    |    +---> Generate deb/rpm via nfpm
    |
    v
[4] Package repository (apt repo)
    |    |
    |    +---> Versioning
    |    +---> Store old versions (for rollback)
    |
    v
[5] Ansible playbook (kinescope-service.yml)
    |    |
    |    +---> Prepare: load spec.yml
    |    +---> Deploy: install package on host group
    |    |      |
    |    |      +---> apt update && apt install
    |    |      +---> Create systemd unit
    |    |      +---> Configure environment variables
    |    |      +---> Configure secrets
    |    |      +---> systemctl start service
    |    |      +---> Health check (check /metrics)
    |    |
    |    +---> Monitoring: add to Prometheus
    |    +---> Notify: annotation in Grafana
    |
    v
[6] Service running
    |
    +---> Metrics available
    +---> Logs collected
    +---> Alerts configured
```

#### Deployment Process Details

**Stage 1: Preparation (Prepare)**
- Playbook reads `spec.yml` from the service repository
- Parses the specification and prepares variables
- Loads encrypted data from Ansible Vault
- Merges variables from different sources (common, environment, service-specific)
- Generates template for environment variables (including encrypted secrets)

**Stage 2: Deployment (Deploy)**
- Updates package cache on target hosts (`apt update`)
- Installs package of specified version (`apt install package=version`)
- Pins package version (`dpkg --set-selections hold`), to prevent automatic updates
- Creates configuration directory (`/etc/${service_name}/`)
- Writes environment variables (including encrypted secrets) to `/etc/${service_name}/environment`
- Generates systemd unit file from template with all limits and settings
- Reloads systemd daemon (`systemctl daemon-reload`)
- Starts service (`systemctl start ${service_name}`)
- Enables autostart (`systemctl enable ${service_name}`)
- Checks health check: makes HTTP request to `/metrics` up to 12 times with 5-second interval, until it gets 200 response

**Stage 3: Monitoring (Monitoring)**
- Adds service to Prometheus configuration (file_sd)
- Reloads Prometheus configuration
- Creates annotation in Grafana about deployment (version, host, user, time)

**Stage 4: Cleanup (Cleanup)**
- Removes temporary files created during deployment

#### Rollback

Rollback to a previous version is as simple as deployment:

```bash
ansible-playbook playbooks/kinescope-service.yml \
  -i inventories/production \
  -e app_version=v1.2.3  # Previous version
```

The playbook will install the specified package version, restart the service, and check health check. Old package versions are stored in the repository, so rollback is always possible.

#### Canary Deployment

For gradual deployment, you can use the `serial` parameter in `spec.yml`:

```yaml
service:
  deploy:
    serial: 1  # Deploy one host at a time
```

Or limit deployment to a specific host:

```bash
ansible-playbook playbooks/kinescope-service.yml \
  -i inventories/production \
  -e app_version=v2.0.0 \
  --limit host-01  # Only on one host
```

After checking on one host, you can deploy to the rest.

#### Health Check and Availability Verification

After starting the service, the playbook checks its availability via the health check endpoint. This is important because:

- **Early problem detection**: if the service didn't start or crashed right after startup, we learn about it before traffic goes to it
- **Automatic check**: no need to manually check that the service is working
- **Integration with load balancers**: the health check endpoint is used not only by Ansible, but also by load balancers for traffic routing

If the health check doesn't pass after 12 attempts (60 seconds), the playbook exits with an error, and you can figure out what's wrong.

Everything with standard OS tools: package manager for delivery, systemd for starting and management, Ansible for automation.

### Building Packages: NFPM

The only thing we use for building is [NFPM (Not FPM)](https://github.com/goreleaser/nfpm). We're too lazy to write a file or edit it manually for building packages each time, so there's a great tool NFPM from GoReleaser. This is a simple tool for creating packages (deb, rpm, apk, ipk, arch linux), written in Go, without dependencies. It allows describing in YAML what you want to see in a package, and building for the needed OS — and then running via systemd.

## systemd Advantages

### System Visibility

First, the service is visible to the system, and we monitor this easily. We throw exporters on the machine, and even if a developer suddenly didn't add monitoring (e.g., endpoint not added or we didn't add it to Prometheus), we'll still see the service because it exposes standard metrics. We pick it up by name — all services are visible in the system; whether it's up or down — that's also visible.

### Resource Isolation

If someone says Docker is needed for resource isolation, that's not quite right. In systemd, limits are written the same way — CPU, memory, and everything you want. That is, it's done flexibly enough.

### Security

Security, naturally, exists: if a service, for example, doesn't work with some devices, it won't be able to reach them. You write all of this in the same place, and it's all visible.

### Scheduled Tasks

We use systemd for scheduled tasks. If someone remembers cron — same idea. We have several tasks that we run rarely, so there's no point keeping a service running all the remaining time. Via systemd we just set a timer/task — it starts, runs, and finishes.

### Performance and Reliability

If we have nothing extra, then there's nothing to break, and no one to waste resources. systemd works stably. Yes, I've heard complaints about systemd that it supposedly consumes many resources, but in our practice its overhead is practically unnoticeable. It's reliable: if systemd doesn't work — nothing works for us, so it's a basic system that everyone watches.

## Automation via Ansible

Usually everyone talks about implementing something. We did the opposite — we removed things and got results almost without doing anything. We didn't even install any additional software. We ended up with a unified package format, delivery works well, there's versioning, isolation — almost a silver bullet.

However, we still had automation questions to address.

### Everything Needs to Be Automated

This might be obvious, but everything needs to be automated, even if you have one server. If it fails, you won't be able to restore it manually — you won't remember the exact configuration, environment, or what it was doing.

### Why Ansible?

For automation, we chose Ansible. We already had it, so the choice was logical. "Why Ansible?" — what else? We used Puppet years ago. It can be extended with plugins and maintained, but "easy to maintain" needs an asterisk: in practice this isn't always true.

If you use Ansible, you inevitably get "garbage" and technical debt. So from time to time we come back and clean: rewrite playbooks, remove unnecessary roles/services and everything that accumulated.

### How Ansible Works for Us

Our setup is simple. We have two teams — developers and engineers who support the system (admins, to put it simply).

Operations handles the base: when a server appears and network is connected, a base role is rolled out on it. Then the server is added to inventory, root access is disabled, access is configured, and monitoring/logging is installed: for example, node exporter and an agent for log collection. We collect all **logs** in the system — not only our services, but everything that exists. This is rarely needed, but when it is, you can see exactly what happened on the host.

For developers, Ansible is also important: playbooks are in the repository, and both sides can commit to it — developers and admins. Developers are fully responsible for their services. Since our services are unified, most often it's enough to copy a "skeleton" and set the needed settings. Routing rules in nginx/proxy are also handled by development — operations rarely touches this.

A developer can add their service "from commit," build it, and deploy it — no admin needed. This lets admins sleep better and worry less.

### "Manifest Style" Without Kubernetes: Unified spec File Per Service

Human error still remains: you can forget memory limits, port for monitoring, some required parameter or dependency. To reduce the probability of errors, we use a unified specification file — `spec.yml` — that describes the entire service lifecycle: from building a package to configuring systemd unit and monitoring.

**Simple idea**: one file in the service repository describes everything needed for its operations. This resembles a Kubernetes manifest, but without Kubernetes itself. From this file, the following is automatically generated:
- deb/rpm package (via the `kinectl` utility, which uses `nfpm` as a library)
- Ansible playbook for deployment
- systemd unit file with correct limits and settings
- monitoring configuration

#### spec.yml Structure

The `spec.yml` file describes a service in YAML format. Here's a minimal example:

```yaml
service:
  name: my-service
  group: applications
  description: "My service"
  deploy:
    probe:
      type: "http"
      port: 9090
      path: /metrics
  limits:
    mem: 500M
    no_file: 5_000
  environments: |
    HTTP_ADDRESS=:8080
    LOG_LEVEL=info
```

A more complete example with dependencies and secrets:

```yaml
service:
  name: my-api-service
  group: applications
  description: "API service"
  deploy:
    serial: 1  # Deploy one host at a time
    probe:
      type: "http"
      port: 9090
      path: /metrics
  limits:
    mem: 1G
    no_file: 10_000
    nproc: 1000
  resources:
    - postgres
    - sentinel
    - memcached
    - nats
  environments: |
    HTTP_ADDRESS=:{{ api_port }}
    LOG_LEVEL={{ log_level }}
    SECRET_KEY={{ vault_secret_key_encrypted }}
    API_TOKEN={{ vault_api_token_encrypted }}
  exec:
    start: "/usr/bin/my-api-service"
    stop: "/bin/kill -s SIGINT $MAINPID"
  security:
    owner: "kinescope"
    group: "kinescope"
```

#### What spec.yml Describes

**Basic parameters:**
- `name` — service name (must match package name)
- `group` — host group for deployment (applications, encoders, storage, etc.)
- `description` — service description

**Deployment:**
- `deploy.serial` — how many hosts to deploy simultaneously (for canary or gradual deployment)
- `deploy.probe` — health check settings (type, port, path)
- `deploy.numa_netdevs` — list of network interfaces for NUMA binding (if needed)

**Resource limits:**
- `limits.mem` — memory limit (e.g., `500M`, `1G`, `unlimited`)
- `limits.no_file` — maximum number of open files
- `limits.nproc` — maximum number of processes
- `limits.nice` — nice value for process
- `limits.allowed_cpus` — allowed CPUs (cpuset, e.g., `"0-3"`)

**Dependencies:**
- `resources` — list of dependencies on other services (postgres, redis, nats, etc.). Environment variables for connecting to these services are automatically added

**Configuration:**
- `environments` — environment variables (including encrypted secrets). Sensitive data is encrypted via Ansible Vault and encoded in base64. When building the binary, a decryption password is embedded (via the `gitlab.kinescope.dev/go/vault` library), and on startup the application automatically decrypts environment variables
- `required_packages` — system packages that need to be installed

**Management commands:**
- `exec.start` — start command (default `/usr/bin/${service.name}`)
- `exec.stop` — stop command (default `SIGINT`)
- `exec.reload` — reload command (if supported)

**Security:**
- `security.owner` and `security.group` — user and group for running the service
- `capabilities` — Linux capabilities (e.g., `CAP_NET_BIND_SERVICE`)

#### Common Mistakes and How to Avoid Them

**Mistake 1: Forgot to specify memory limit**
```yaml
# Bad: no limit
service:
  name: my-service
  # limits missing

# Good: limit specified
service:
  name: my-service
  limits:
    mem: 500M
```

**Mistake 2: Wrong port for health check**
```yaml
# Bad: port doesn't match actual
deploy:
  probe:
    port: 8080  # But service listens on 9090

# Good: port matches
deploy:
  probe:
    port: 9090  # Service really listens on 9090
```

**Mistake 3: Forgot to specify dependencies**
```yaml
# Bad: service uses PostgreSQL, but it's not specified
service:
  name: my-service
  # resources missing, but code uses POSTGRES_DSN

# Good: dependencies specified
service:
  name: my-service
  resources:
    - postgres  # Will automatically add POSTGRES_DSN
```

**Mistake 4: Secrets in plain text**
```yaml
# Bad: secrets in plain text
environments: |
  SECRET_KEY=super-secret-key  # Insecure!

# Good: secrets encrypted via Ansible Vault and encoded in base64
environments: |
  LOG_LEVEL=info
  SECRET_KEY={{ vault_secret_key_encrypted_base64 }}  # Encrypted via Ansible Vault, then base64
  # When building binary, decryption password is embedded via gitlab.kinescope.dev/go/vault
  # On startup, application automatically decrypts environment variables
```

**How this works in practice:**

1. **Encrypting secret** (when preparing configuration via Ansible Vault):
   ```bash
   # Secret is encrypted via Ansible Vault and encoded in base64
   ansible-vault encrypt_string "my-secret-key" --vault-password-file vault-pass | base64
   ```

2. **In spec.yml** the secret is stored encrypted:
   ```yaml
   environments: |
     SECRET_KEY={{ vault_secret_key_encrypted_base64 }}
   ```

3. **In application code** the `gitlab.kinescope.dev/go/vault` library is used:
   ```go
   package action
   
   import "gitlab.kinescope.dev/go/vault"
   
   var (
       vaultPassword = ""  // Embedded at build time via -ldflags
       skipDecrypt, _ = strconv.ParseBool(os.Getenv("SKIP_DECRYPT"))
   )
   
   var Flags = []cli.Flag{
       vault.StringFlag{
           Name:        "secret-key",
           EnvVar:      "SECRET_KEY",
           Value:       "",  // Value from environment variable (encrypted)
           Password:    vaultPassword,  // Embedded at build time via Makefile
           SkipDecrypt: skipDecrypt,    // For local development
       },
   }
   ```

4. **At build time** the decryption password is embedded via Makefile:
   ```makefile
   VAULT_PASSWORD ?=""
   LDFLAGS := -X '$(GO_PACKAGE)/cmd/service/action.vaultPassword=$(VAULT_PASSWORD)'
   
   build:
       go build -ldflags "$(LDFLAGS)" -o service cmd/service/main.go
   ```

5. **On startup** the application automatically decrypts environment variables. If the `SKIP_DECRYPT=true` variable is set, the value is used as-is (for local development).

Thus, encrypted secrets can be safely stored in `spec.yml` and environment variables without exposing them in plain text on servers. The decryption password is embedded in the binary at build time, which allows the application to automatically decrypt secrets on startup.

#### Approach Benefits

- **Single source of truth**: all service information in one place
- **Fewer errors**: the utility can check required fields and set defaults
- **Automation**: everything needed for deployment is generated from one file
- **Versioning**: spec.yml is stored in Git with code, changes can be tracked
- **Simplicity**: a developer doesn't need to know Ansible or systemd details — just describe the service in spec.yml

This isn't a complete replacement for Kubernetes manifests, but for our case it's sufficient. We get many benefits of the "manifest style" approach without orchestrator complexity.

## Scaling and Fault Tolerance

### What Is Scaling?

Scaling was one of our goals: the system should scale and be fault-tolerant. In Kubernetes, autoscaling means load arrives and a new service instance "appears." Creating service instances on the fly seemed questionable to us: it adds complexity and magic, and we wanted predictability.

If a service needs to handle more traffic, we wanted it to handle that traffic through normal horizontal scaling by hosts/groups. We didn't want a separate "magical" entity deciding when and how many instances to create. A single load balancer is also a failure point — once you have a master, you have a failure risk, and we didn't want that.

### Simple Solution: Server Groups

We solved scaling simply — "like in the old days." Servers are divided into groups: application servers (simple, cheap machines), CDN servers (we work with video — lots of traffic and disk), transcoding servers (different configuration: network/CPU/GPU for video processing), etc.

Servers have different configurations because they handle different tasks. It's simple: each group has more than one server. If one isn't enough, we add more. This is most relevant for CDN (more traffic means more servers) and transcoding (we add machines to the group, they pull tasks from the queue).

### Fault Tolerance via DNS and BGP

Fault tolerance comes from simple mechanisms. For background tasks: if one server drops out, tasks remain in the queue and are picked up by others — everything continues working.

For HTTP traffic we use a two-tier scheme. First, DNS directs users to the appropriate region (e.g., users from Russia go to Russian servers). Then within the region, load balancing by server groups routes users to a data center, and then to a specific server in the group.

If a server fails, BGP is disabled and it drops out of distribution in about one and a half seconds — fast enough for us. When it comes back up, it's automatically added back to routing. This works well.

### Custom DNS Server

We went further: we built our own DNS servers and can configure routing very precisely. Yes, we "reinvented the wheel" and wrote our own DNS server — but it lets us set traffic processing rules exactly as needed.

This helps a lot with CDN scaling. For large clients, we can optimize infrastructure, and DNS is key to this. No one offered such a solution out of the box — we had to build it ourselves.

## Solution Benefits

Benefits from what we got:

- **Almost nothing had to be done** — usually everyone talks about what they "implemented," but we removed a lot instead
- **Reliable** — we removed complexity rather than adding it. We use what the operating system provides out of the box, without installing anything extra
- **Simple enough** — no overhead: software runs in the environment, just install and start
- **Monitors excellently** — not because we wrote something clever, but because we standardized our approach to metrics, logs, and everything else. All **logs** in one place — thanks to Loki, which we switched to at some point. Now there's a lot available "out of the box" and free for operations

## Drawbacks

For us, there are basically no drawbacks. Others might see them, but the result works for us. There's not much to "improve" here: we have fewer components because we removed a lot.

If we think about it, of course they exist:

- **No autoscaling** — which I talked about in the Kubernetes context. We have our own hardware, that is, we can't "snap our fingers" and get additional resources. In the cloud this is simpler: most providers provide autoscaling — more traffic came, a virtual machine started; traffic dropped — the machine can be deleted and money saved
- **Can break** — for example, a repository might disappear or require manual package management. So we package almost all additional software ourselves (Grafana, Loki, exporters, VictoriaMetrics, Prometheus, etc.) and keep it in our repository. We use external repositories minimally (e.g., nginx)
- **Can't locally spin up "the whole system with one command"** — for newcomers this would sometimes be convenient. But it's not needed: there are many services, and to work on a specific service, you don't need to spin up everything. Usually a database, nginx, and the service itself are enough
- **Can't google a ready Helm chart and close the task** — sometimes this is convenient, but it has a downside: you can "install by default" and not understand how it works. I had a real case: Kafka was set up with default paths in `/tmp`, and this only came to light when problems started. So we prefer people to understand what they're installing and how it will run in production

## Observability: Metrics, Logs, Alerts

Observability doesn't depend on Kubernetes. We use a standard stack: Prometheus for metrics, Loki for logs, Grafana for visualization, AlertManager for alerts.

### Minimum Metrics Set for a Service

Each service should expose at minimum:

- **Version and build time** — to always know which version is running
- **Health check endpoint** — `/metrics` or `/health` for availability check
- **Go runtime metrics** (if the service is in Go) — GC activity, memory usage, number of goroutines

Additionally useful:
- Business logic metrics (request count, errors, latency)
- Dependency metrics (DB response time, cache, external APIs)
- Resource metrics (CPU, memory, disk, network)

### Centralized Logs

All services write logs to stdout/stderr, systemd collects them in journald, and Promtail sends to Loki. This allows:

- Seeing logs of all services in one place
- Searching by time, host, service
- Setting alerts on log patterns
- Analyzing incidents after they're resolved

### Alerts and Response

Alerts are configured in Prometheus and sent to AlertManager, which groups them and sends to Telegram. Main alert types:

- **Service unavailable** — health check doesn't respond
- **High memory usage** — exceeding limit or threshold
- **Disk space shortage** — free space < 25%
- **High temperature** — for physical servers
- **Dependency problems** — DB, cache, queues unavailable

### Checklist: What Each Service Should Have

For operations to be predictable, each service should have:

- ✅ **Health check endpoint** — `/metrics` or `/health` on a separate port
- ✅ **Version metrics** — version, build time, service name
- ✅ **Logging** — structured logs to stdout/stderr
- ✅ **Resource limits** — memory, file descriptors, processes (in `spec.yml`)
- ✅ **Graceful shutdown** — correct handling of SIGTERM/SIGINT
- ✅ **Environment variables** — all configuration via env, not via files
- ✅ **Dependencies** — specified in `spec.yml` via `resources`
- ✅ **Documentation** — description in `spec.yml` via `description`

If a service matches this checklist, its operations will be simple and predictable.

## Common Problems and Their Solutions

### Service Doesn't Start

**Symptoms**: `systemctl status` shows `failed`, logs show an error.

**Diagnostics**:
```bash
# Check status
systemctl status my-service

# View logs
journalctl -u my-service -n 50

# Check configuration
cat /etc/my-service/environment

# Check file permissions
ls -la /usr/bin/my-service
```

**Common causes**:
- Wrong environment variables (check `/etc/my-service/environment`)
- Missing dependencies (DB, cache unavailable)
- Wrong file permissions
- Port already occupied by another process

**Solution**: Fix configuration and restart the service.

### High Memory Usage

**Symptoms**: `MemoryUsed` alert, service works slowly, possible OOM kill.

**Diagnostics**:
```bash
# Check memory usage
free -h
htop

# Find processes with high usage
ps aux --sort=-%mem | head

# Check systemd limits
systemctl show my-service | grep Memory

# Check Go metrics (if service is in Go)
curl http://localhost:9090/metrics | grep go_memstats
```

**Common causes**:
- Memory leak in code
- Limit too small for load
- Many goroutines/processes (check `go_goroutines`)

**Solution**: Increase limit in `spec.yml` (short-term) or fix leak (long-term).

### Disk Space Shortage

**Symptoms**: `RootFS` or `DataFS` alert, write errors.

**Diagnostics**:
```bash
# Check disk usage
df -h

# Find large files
du -sh /* | sort -h

# Check systemd logs
journalctl --disk-usage

# Clean old logs
journalctl --vacuum-time=7d
```

**Common causes**:
- Accumulated logs (journald, applications)
- Temporary files not deleted
- Data growth (DB, cache)

**Solution**: Clean logs, delete temporary files, increase disk or add new one.

### Network Problems

**Symptoms**: High latency, packet loss, service unavailability.

**Diagnostics**:
```bash
# Check network interfaces
ip addr
ip link

# Check routing
ip route
birdc show protocols  # If BGP is used

# Check availability
ping host
traceroute host

# Check ports
ss -tulpn | grep port
```

**Common causes**:
- Physical connection problems
- Wrong routing
- Firewall blocking traffic
- BGP session problems

**Solution**: Check physical connection, routing, firewall rules, BGP sessions.

### Dependency Problems

**Symptoms**: Service can't connect to DB, cache, queues.

**Diagnostics**:
```bash
# Check environment variables
cat /etc/my-service/environment | grep POSTGRES
cat /etc/my-service/environment | grep REDIS

# Check dependency availability
nc -zv db-host 5432
redis-cli -h cache-host ping

# Check service logs
journalctl -u my-service | grep -i "connection\|timeout\|error"
```

**Common causes**:
- Dependency unavailable (down, network problems)
- Wrong credentials (check encrypted environment variables)
- Connection limit exceeded

**Solution**: Check dependency availability, fix credentials, increase connection limit.

## Non-Obvious Benefits

There are also these non-obvious benefits:

- **Became simple and reliable** — in three years, nothing has failed due to systemd or package managers. If something broke, it was our mistakes (usually on the service side). We can always roll back. The scariest thing, as usual, is deployment — that's where you can really break something
- **Admins relaxed** — before, admins lived in 24/7 mode: many alerts, constant investigations. Now there are fewer alerts, which sometimes leads to "relaxation" — someone can be on a train and respond "I'll be available in half an hour." This is good (less burnout) but requires discipline

## Conclusion

We've shown that you can successfully operate production infrastructure without Kubernetes and Docker, using standard Linux tools: systemd, package managers, and Ansible. This solution turned out simpler, more reliable, and more efficient for our case.

Key points:

1. **Simplicity over complexity** — standard tools solve most tasks without additional abstraction layers
2. **One binary — one service** — simplifies delivery, versioning, and operations
3. **Unified spec.yml** — one file describes the entire service lifecycle, reducing error probability
4. **Automation via Ansible** — all infrastructure as code, developers don't depend on admins
5. **Scaling via server groups** — simple horizontal scaling without orchestrators
6. **Fault tolerance via DNS and BGP** — traffic routing at the network level
7. **Observability doesn't depend on orchestrator** — metrics, logs, and alerts work independently of Kubernetes

In three years of operation, nothing has failed due to systemd or package managers. This shows that a simple solution can be more reliable than a complex one.

It's important to understand: this doesn't mean Kubernetes is bad or shouldn't be used. It means that for our case (own hardware, specific requirements, small team) a simple solution turned out more efficient.

Similar topic with a different focus (requirements, tool choice, economics) — see [Why We Didn't Choose K8s]({{< relref "why-we-didnt-choose-k8s.md" >}}).

## Useful Resources

- [systemd: Documentation and Examples](https://www.freedesktop.org/software/systemd/man/systemd.service.html) — official documentation on systemd unit files, resource limits, and security
- [Ansible: Documentation and Best Practices](https://docs.ansible.com/) — official Ansible documentation with examples of playbooks and roles
- [NFPM: Creating Linux Packages](https://github.com/goreleaser/nfpm) — tool for creating deb/rpm packages from YAML description
- [systemd: Resource Isolation and Security](https://www.freedesktop.org/software/systemd/man/systemd.resource-control.html) — how to configure CPU, memory limits, and other restrictions via systemd
- [Debian Packaging Guide](https://www.debian.org/doc/manuals/packaging-tutorial/packaging-tutorial.en.pdf) — guide to creating deb packages (useful for understanding package structure)
- [systemd timers instead of cron](https://www.freedesktop.org/software/systemd/man/systemd.timer.html) — how to use systemd for scheduled tasks instead of cron
- [Ansible Vault: Storing Secrets](https://docs.ansible.com/ansible/latest/vault_guide/index.html) — secure storage of passwords and secrets in Ansible playbooks
- [BGP and Anycast for Fault Tolerance](https://www.cloudflare.com/learning/security/glossary/what-is-anycast/) — how to use BGP/anycast for traffic routing and ensuring fault tolerance
- [DNS for Traffic Routing](https://www.cloudflare.com/learning/dns/what-is-dns/) — DNS basics and how to use it for geo-routing
- [Simplicity vs Complexity in Infrastructure](https://blog.cloudflare.com/cloudflare-outage/) — examples of how excessive complexity can lead to problems (using Cloudflare as an example)

> **Practical Note.** When choosing infrastructure tools, it's important to understand: the more components, the more failure points. Standard Linux tools (systemd, package managers) are time-tested and have less "magic," which simplifies problem diagnostics. Source: experience operating more than 50 servers without Kubernetes.

## Footnotes

[^go-choice]: Go's single-binary deployment model and minimal dependencies make it ideal for our infrastructure approach. Similar topic with a different focus — see [Why We Didn't Choose K8s]({{< relref "why-we-didnt-choose-k8s.md" >}}).

