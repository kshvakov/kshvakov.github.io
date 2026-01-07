---
title: "Why We Didn't Choose K8s: Staying Efficient and Improving Performance"
date: 2024-06-28
description: "Article based on a talk at TeamLead Conf: why we don't use Kubernetes in production and how we built operations on systemd, deb packages, and Ansible."
tags: ["kubernetes", "devops", "infrastructure", "systemd", "ansible", "operations", "kinescope", "observability", "delivery", "performance"]
---

I'll cover the requirements we formulated, why we ultimately didn't "install Kubernetes," and how we built operations on standard Linux tools.

Similar topic, but with a different focus and for a different audience (DevOpsConf) — see [Operations Without K8s]({{< relref "operations-without-k8s.md" >}}).

{{< youtube id="Xkam_SUWUE0" title="Why We Didn't Choose K8s: Staying Efficient and Improving Performance / Kirill Shvakov, Kinescope" >}}

## TL;DR

- **Requirements first, then tools**: releases and rollbacks, observability, security, fault tolerance, cost of ownership.
- **Service unification**: one service — one binary, unified rules for metrics, logs, and configuration.
- **Delivery like regular software**: packages (deb/rpm) + repository + systemd units.
- **Observability doesn't depend on Kubernetes**: metrics, centralized logs, alerts.
- **Scaling is planning and server groups**, not "autoscaling for autoscaling's sake."
- **Fault tolerance can be done at the network level** (DNS/BGP/anycast) and with simple patterns inside services.

## Introduction: Why We Need to Talk About Kubernetes

People often say about Kubernetes: "Kubernetes is the new Linux. Install it, and everything will be fine." This is partially true: it does provide many important things "out of the box" — orchestration, self-healing, autoscaling, network abstractions.

But there's a nuance: you pay for system complexity every day — through investigations, incidents, onboarding people, and cost of ownership. So we first honestly answered the question: **what do we actually need from infrastructure**, and only then chose tools.

## Context: Where We Started

We build a video platform: high traffic, many requests, lots of data. In such systems, reliability and predictability aren't a "nice bonus," but part of the product.

We didn't start from scratch: before Kinescope there were other projects and legacy code. One typical legacy problem is a zoo of languages and delivery methods.

Historically, we had two main stacks: **Go and Ruby** (instead of Ruby it could be any scripting language with lots of dependencies). Go is convenient: build one binary — and you're done[^go-benefits]. Scripting languages often pull in system dependencies, and the natural packaging for them is Docker.

The next step seems obvious: if Docker already exists, why not "roll it into Kubernetes"? That's what many do. At some point we did have Kubernetes — but it consumed resources, sometimes broke, and diagnostics became very complex.

As the system grew, we needed more predictability and control, not another layer.

## Requirements We Formulated

Any project has functional requirements (what the product does) and non-functional requirements (how it lives in production). If we reduce non-functional requirements to a practical list, it usually looks like this:

- **Simplicity and predictability**: minimum hidden logic, transparent diagnostics.
- **Releases and rollbacks**: fast, reproducible, with clear versioning.
- **Scaling and cost**: ability to grow with load and not "eat up" margins.
- **Availability and fault tolerance**: the system should survive degradations and node failures.
- **Security**: restrictions at the OS and network policy level, minimal privileges.
- **Observability**: metrics, logs, alerts — to understand what's happening.

It's useful to separately distinguish requirements from two sides:

- **Operations** needs unification: same ports and metrics, configuration via environment variables, same service format.
- **Development** needs autonomy: don't wait for an admin, don't manually request logs and monitoring, be able to deploy independently.

## Why We Didn't Choose Kubernetes

Kubernetes does cover some requirements "out of the box": orchestration, autoscaling, self-healing, network abstractions. But for our case, the cost of complexity and an additional layer turned out to be higher than the benefit:

- **Complexity and diagnostics**: the more components — the more failure points and unpredictability during investigations.
- **Overhead**: additional daemons and control planes, network, control plane, hardware overhead.
- **Expertise**: a large tool requires stable expertise and support.

To simplify: we already have Linux, and we didn't see the need to add "new Linux on top of old Linux" when basic requirements can be met with OS tools.

> **Practical Note.** When choosing infrastructure tools, it's important to understand: each additional abstraction layer adds complexity and failure points. Kubernetes solves many tasks "out of the box," but for many cases standard Linux tools are sufficient. It's important to first formulate requirements, then choose solutions, not the other way around. Source: experience operating production infrastructure without Kubernetes.

## Basic Principle: To Make It Reliable — Remove the Unreliable

The wording sounds harsh, but the meaning is simple: the more components in a system, the more failure points, more expertise needed for support, and higher cost of ownership.

If we simplify to the minimum we definitely need, this is what remains:

- **Linux** (the operating system is needed anyway, can't do without it)
- **Go** (as the main stack: convenient to build, deliver, and maintain)

Next, the task is to build a clear software lifecycle around this: build → deliver → start → monitor → update/rollback.

## Solution: One Service — One Binary

We took a slightly different path: instead of building "a platform for services that can do anything," we brought the services themselves to the needed state.

### One Binary

One service should be one binary with standard metrics and everything else. Where legacy code didn't fit this model (e.g., Ruby), we gradually aligned the stack by rewriting to Go or moving to a compatible model.

### Unified Operations Rules

We try to ensure all services have the same "shell":

- configuration via environment variables;
- metrics and health endpoints in a unified format;
- standard logs.

The "one binary" approach works not only for APIs. "Non-services" also fit this model: website, admin panel, player. We pack static assets inside the binary, so from an operations perspective everything looks the same — whether it's a player, API, or DNS server.

## Why Not Docker

Docker is often proposed as "universal packaging": convenient, resource isolation, portability. But this has a cost — overhead and complicated diagnostics (especially over the network).

In our case, we wanted a proven and minimal solution. Docker wasn't "absolute evil," but it was an unnecessary layer: too large, unnecessary, and adding performance overhead in places.

## Delivery and Launch: Packages + systemd

Any "regular" software has a lifecycle: build → test → deliver → install → update/rollback. In Linux this has long been solved:

#### Service Lifecycle

```text
development
   |
   v
build (go build)
   |
   v
package (deb/rpm)
   |
   v
repository
   |
   v
server group
   |      |
   |      +---> apt/yum install
   |      |
   |      +---> systemd unit
   |             |
   |             +---> systemctl start/restart
   |                    |
   |                    +---> monitoring/metrics
   |                           |
   |                           +---> rollback (if needed)
```

Standard OS tools cover the entire cycle: build, delivery, launch, monitoring, rollback.

- **package manager** (deb/rpm and repository) — for delivery and versioning;
- **systemd** — for starting, restarts, resource limits, and scheduled tasks.

### Building Packages

We build packages via `nfpm`: describe contents and metadata in YAML and get deb/rpm for needed distributions.

A key principle: we don't build deb packages "just to package them in Docker, then in Kubernetes." That would be strange — both technically and conceptually.

### What systemd Provides

- **Visibility**: services are visible to the system, can monitor statuses and resources.
- **Resource isolation**: CPU/memory limits, permissions, sandboxing.
- **Timers**: scheduled tasks (alternative to cron) without a separate "zoo."

### Why This Resembles Kubernetes (and Why It's Enough for Us)

If you look at systemd and Kubernetes objectively, you'll notice many similar ideas.

- There's a **service description** (unit or manifest)
- There's a **restart policy**
- There are **resource limits**
- There's **observability wrapping**

The difference is the abstraction level. Kubernetes does this "on top," adding its control plane, network, API, and ecosystem. This can be justified, but in our case the basic OS level is sufficient, while an extra layer complicates operations.

## Observability: Metrics, Logs, Alerts

Observability isn't tied to Kubernetes.

- **Metrics**: services expose standard metrics that are picked up by monitoring.
- **Logs**: services write to stdout/files, then centralized collection and viewing in Grafana (e.g., via Loki).
- **Alerts**: the main reaction is to alerts, not "staring at graphs."

Beyond application logs, we also collect logs and metrics from "external software" (DB, nginx, etc.) using exporters and log collection, just like everyone else.

Here's a real example: when we needed to analyze database queries, we did it without Kubernetes. We ran our own UDP server with a simple protocol, sent query information from the driver, stored it in ClickHouse, and viewed it in Grafana.

For more on practical monitoring setup, typical problems and their solutions, see [Operations Without K8s]({{< relref "operations-without-k8s.md" >}}).

## Automation: Ansible and Reducing Human Error

Automation is always needed — even if you have one server. If a host burns down, you won't restore it "exactly as it was" by hand.

For automation we use Ansible. A classic Ansible problem is that over time garbage and technical debt accumulate, so playbooks need periodic cleaning.

Our workflow is roughly:

- **Operations** rolls out a base role on a new server (network, basic settings, access, monitoring and logging).
- **Development** is responsible for their services: roles, units, and routing. A developer can add a service "from commit" and deploy it without admin involvement.

### "Manifest Style" Without Kubernetes: One spec File Per Service

Human error is still a factor: you can forget limits, monitoring, or some required parameter. To reduce this, we use a unified specification file — `spec.yml` — that describes the entire service lifecycle.

**Idea**: one file in the service repository describes everything needed for its operations. This resembles a Kubernetes manifest, but without Kubernetes itself. From this file, a deb package is automatically generated (via the `kinectl` utility, which uses `nfpm` as a library), Ansible playbook for deployment, systemd unit file, and monitoring configuration.

#### Example spec.yml

Here's what a typical `spec.yml` for a service looks like:

```yaml
service:
  name: my-api-service
  group: applications
  description: "API service"
  deploy:
    serial: 1  # Deploy one host at a time (canary)
    probe:
      type: "http"
      port: 9090
      path: /metrics
  limits:
    mem: 1G
    no_file: 10_000
  resources:
    - postgres
    - sentinel
    - nats
  environments: |
    HTTP_ADDRESS=:8080
    LOG_LEVEL=info
    SECRET_KEY={{ vault_secret_key_encrypted }}
```

#### What This Provides

- **Single source of truth**: all service information in one place, versioned with code
- **Fewer errors**: the utility can check required fields and set defaults (e.g., if limits were forgotten)
- **Automation**: everything needed for deployment is generated from one file
- **Simplicity**: a developer doesn't need to know Ansible or systemd details — just describe the service in spec.yml

If a developer forgot to specify limits — the utility can set defaults. The idea is simple: reduce the probability of accidental errors and make the deployment process more predictable.

For more on the `spec.yml` format and practical examples, see [Operations Without K8s]({{< relref "operations-without-k8s.md" >}}).

## Scaling and Fault Tolerance

### What Scaling Is

We distinguish two types:

- **vertical**: increase resources of one host (in the cloud often done "manually");
- **horizontal**: add hosts to a group.

We don't consider "virtual scaling" (many entities on one piece of hardware for reporting) useful: hardware is still purchased, space and energy are consumed, so there's no savings — only added complexity.

### Server Groups

Servers are divided into groups by task (application/CDN/transcoding, etc.). Each group has more than one host. When more capacity is needed, we add servers to the group (planned scaling).

### Fault Tolerance: DNS/BGP/anycast

For external HTTP traffic, the scheme is two-level:

1. **DNS** directs to a region or point of presence.
2. Inside the point — **load balancing by group**.

At the network level we use **BGP/anycast**: if a host "falls" or is taken out of service, it quickly drops out of distribution; when it comes back up — returns to routing.

### Client-Side Load Balancing

For internal traffic (inter-service communication) we avoid a dedicated entity that becomes a failure point. Often it's simpler and more reliable when clients know several addresses and balance on their side.

## Q&A

### Releases With or Without Downtime?

We have many releases: 20–30 deployments per day. Organizationally, we can't "warn clients about releases."

At the same time, we try to do releases without downtime:

- For external services that must always be available, traffic is redirected **at the network level**: BGP session is dropped, and the node almost instantly drops out of distribution (current sessions break and clients reconnect to other nodes).
- If it's a service behind a proxy or load balancer, switching happens **at the proxy and health policy level**: binary stopped — traffic went to other instances, came back up — returned.

Downtime happens not because of our deployment scheme, but because of release errors — "messed up, deployed garbage, something broke."

### How Do You Monitor the "Zoo" of Services?

Metrics and centralized logs (Loki/Grafana). Exporters for third-party software. No one constantly stares at graphs — we live by alerts.

### Is the OS Version the Same on All Servers?

Not necessarily. For Go services this usually isn't a problem (minimal dependencies). For software with system dependencies, there can be different builds or packages for different OS versions.

### Where Do You Store Secrets?

We don't want to "spread" secrets across servers and config files. Truly secret data is stored centrally (e.g., in a database with access segregation). Access to production is limited, and ideally developers don't need it at all — diagnostics are done via metrics and logs.

**How this works technically**: In configs and environment variables, all sensitive data is encrypted via Ansible Vault and encoded in base64. When building the binary, a decryption password is embedded (via the `gitlab.kinescope.dev/go/vault` library). On startup, the application automatically decrypts environment variables using the embedded password. This allows storing encrypted secrets in `spec.yml` and environment variables without exposing them in plain text on servers.

### Did You Calculate Cost vs Kubernetes?

What doesn't exist is usually cheaper to support. In the cloud, the balance may be different: you can "pay with money" to reduce requirements for people and hardware. On your own hardware with high traffic, the economics are often different.

## Conclusion

The main point isn't that "Kubernetes is bad." The main point is:

- you can't choose a tool before requirements;
- for some companies Kubernetes is an excellent answer (especially in the cloud);
- for some companies (like ours) it's simpler and cheaper to meet requirements with OS tools: packages, systemd, Ansible, and a minimal number of additional components.

## Useful Resources

- [systemd: Documentation and Examples](https://www.freedesktop.org/software/systemd/man/systemd.service.html) — official documentation on systemd unit files, resource limits, and security
- [Ansible: Documentation and Best Practices](https://docs.ansible.com/) — official Ansible documentation with examples of playbooks and roles
- [NFPM: Creating Linux Packages](https://github.com/goreleaser/nfpm) — tool for creating deb/rpm packages from YAML description
- [systemd: Resource Isolation and Security](https://www.freedesktop.org/software/systemd/man/systemd.resource-control.html) — how to configure CPU, memory limits, and other restrictions via systemd
- [Observability Without Kubernetes](https://grafana.com/docs/loki/latest/) — Loki for centralized log collection and Grafana for metric visualization
- [Prometheus: Monitoring and Metrics](https://prometheus.io/docs/introduction/overview/) — monitoring system that works independently of orchestrators
- [BGP and Anycast for Fault Tolerance](https://www.cloudflare.com/learning/security/glossary/what-is-anycast/) — how to use BGP/anycast for traffic routing
- [Simplicity vs Complexity in Infrastructure](https://blog.cloudflare.com/cloudflare-outage/) — examples of how excessive complexity can lead to problems
- [Kubernetes: When It's Justified](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/) — official Kubernetes documentation (useful for understanding when it's really needed)
- [Go: Operational Simplicity](https://go.dev/doc/effective_go) — how Go simplifies application delivery and operations

> **Practical Note.** When choosing infrastructure tools, it's important to first formulate requirements, then choose solutions. Kubernetes solves many tasks "out of the box," but adds complexity and overhead. For many cases, standard Linux tools are sufficient. Source: experience operating production infrastructure without Kubernetes.

## Footnotes

[^go-benefits]: Go's single-binary deployment model simplifies operations and reduces dependencies, making it well-suited for our infrastructure approach.

