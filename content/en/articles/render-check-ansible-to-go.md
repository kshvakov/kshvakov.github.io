---
title: "One Undefined Variable and 80 Minutes of CI: Why We Moved Our Ansible Rendering to Go"
date: 2026-10-10
lastmod: 2026-10-10
description: "How a refactor of our Ansible variables ran into an 80-minute gating pipeline and ended with Go rendering: 85 specs across two environments in 3.5 seconds, byte-for-byte parity with Ansible, and a deployment plan on the same SDK."
tags: ["ansible", "go", "sre", "ci", "infrastructure", "templating", "kinescope"]
---

Here's how refactoring the vars layer of our Ansible setup ran head-first into a gating pipeline that took longer to run than it took the author to address review comments. Here's where that led: rendering 85 specs for two environments in Go in 3.5 seconds, byte-for-byte parity with Ansible, and a contribution upstream.

I've written before about how this infrastructure works overall — one binary, systemd, packages, and Ansible instead of Kubernetes — in [Operations Without K8s]({{< relref "operations-without-k8s.md" >}}). This piece focuses on the config layer and its safety net.

## TL;DR

- **The IaC got scary**: a global `kinescope` dictionary at 834 lines, 210 of them ports belonging to other services; a single vault reference took down 21 roles and 84 of our 85 specs.
- **The safety net for the refactor was render-check**: render every spec from the baseline and the working tree, compare byte for byte.
- **Ansible as a rendering engine didn't cut it**: about 80 minutes per full run (340 playbook invocations).
- **go-ansible/template as an SDK**: Go renders the entire corpus in ~3.5 seconds, byte-identical to Ansible; before switching, a pilot on 70 spec × environment pairs, zero diffs.
- **An upstream contribution**: `RegisterFilter` (PR #41, shipped in v0.33.0); `RegisterTest` (PR #42) grew out of the same review.
- **Ansible stays as the organization**, only the executor changes: next up is application deployment on the same SDK.

## How It Started: IaC That Got Scary

At Kinescope, a video platform, our infrastructure is declarative: every service is described by a spec file (YAML under `specs/`), from which we generate environment files (`/etc/<svc>/environment`) and secrets through Jinja2 templates. This whole world lives in Ansible: roles, inventories, and an IaC layer of our own that had been accreting for years.

And that layer went the way most IaC goes when it grows without hard conventions: it got scary. The first violated principle was [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/) (LoB, Carson Gross's term): a system's behavior should be visible where it's described. Ours was the opposite — a service's port and config lived hundreds of lines away from its description, in a global dictionary. Second, Single Source of Truth: a value that belonged to a service had an owner that wasn't its consumer — touching one service meant editing a shared file. Third, composition over copy-paste: a new environment was assembled as a copy of a neighbor's overlay rather than overriding just the differences. The main symptom was the mess in `vars/`.

The precise diagnosis came from an incident. A run of `ansible-playbook playbooks/proxmox.yml --tags ops_exporter` failed with `AnsibleUndefinedVariable: 'acme_manager_cloudflare_api_token' is undefined` while resolving `kinescope.ops.exporter.monitoring_port`. We patched it locally by adding the variable to vars. But the root cause was systemic.

We broke down `vars/kinescope.yml` — the global `kinescope` dictionary, 834 lines — by owner:

- ports, 210 lines — owner: the service, via its spec;
- service configuration (debug flags, buckets, limits, external API URLs), about 350 lines — the service again;
- proxy references to secrets and versions, a couple dozen;
- database and NATS addresses, about 50 lines — already moved into spec `resources:`;
- domains and shared hosts, about 30 lines — the only genuine per-env delta.

In other words, the dictionary that every run passes through was nine-tenths somebody else's data.

The fallout was predictable. On ansible-core 2.16, referencing any `kinescope.x.y` templates the entire dictionary — so one unresolved vault reference in an inventory that doesn't have that secret took down 21 roles and 84 of the 85 specs. The `vars/<env>/kinescope.yml` overlays could only override: the production overlay ran 799 lines and 355 leaf keys, only 62 actually differed, and another 42 were literal copies of the base. 29 of 66 playbooks carried copy-pasted `pre_tasks` with a four-step include/merge dance. Adding a new service meant editing the shared blob.

We sat down and wrote a refactoring plan: the spec becomes the single source of truth for ports, a generated `ports.yml` projection replaces the hand-maintained blob, secrets live only in vault and are substituted at the point of use, and merge_yaml plus the overlays go away. It's a good plan, step by step, each step self-contained.

One problem remained: proving the refactor changes nothing.

## The Safety Net: render-check

Refactoring a config layer with no way to verify the rendered output didn't change is a leap of faith. 84 of our 85 specs read `kinescope.*`, and a vars change can silently alter a neighbor's port. So the first item in the plan was the render-check gating pipeline: take a baseline (the merge base of the MR — GitLab's merge request; a PR, if you're on GitHub), render every spec, render the same specs from the working tree, and compare byte for byte. Any diff — red pipeline — and the author figures out whether it was intentional or a breakage.

The logic is sound. The implementation wasn't.

## Shooting Ourselves in the Foot with Ansible: 80 Minutes per Test Run

We'd already built the rendering by hand — a harness that mimicked the `kinescope_service` role's mechanics: two template passes, spec_import, merge_yaml, vault. Rather than rewriting it, we used Ansible as the engine: a bash script checked out a git worktree at the baseline, then ran `ansible-playbook` with a render playbook once per spec. One process per spec, per comparison side, per environment. A full run: 85 specs × 2 environments × 2 sides — about 340 playbook invocations.

Each invocation pays for a Python interpreter startup, Ansible loading, inventory and vault parsing — all orders of magnitude more expensive than the rendering itself, which takes milliseconds. Runs were sequential: each spec waited for the previous one to finish. Total: about 80 minutes for a full production and staging run.

For a gating pipeline in an MR, that's a death sentence. The check doesn't fit into the review loop: the MR is open, the author is addressing comments, and the gate from the previous commit is still running. People started ignoring a red gate or blindly retrying it — and a gate people ignore is worse than no gate.

So that's the first tax: time. The second accumulated more quietly: the dependency on Python modules, including ones that have to be installed on target hosts. Every Python version is its own compatibility matrix, every module a failure point at the least convenient moment. At the time it was background noise; the acute pain was 80 minutes per MR.

## go-ansible/template as an SDK

We didn't want to write our own Jinja2 implementation with Ansible semantics — that's months of work. And then we found [`github.com/go-ansible/template`](https://go-ansible.github.io/docs/latest/components/template/) just in time: a Go implementation of Ansible's templating semantics on top of gonja. Jinja2-compatible syntax, StrictUndefined like Ansible, Ansible's filter library — but, at the time, no way to register filters of your own. For us it wasn't a "template engine" so much as an SDK: we built a render pipeline on it — inventory and vars loaded into memory, merge_yaml semantics reproduced as a fixed point, five custom filters (`hosts_port`, `hosts_addrs`, `each_hostvars`, `set_flags`, `vault_base64`) ported from Python to Go — and a single process rendered the entire corpus.

What the library gives you: template semantics. What it doesn't: Ansible's variable semantics. The key difference: Ansible resolves nested templates when a variable is looked up. When you reference `some_var` and its value is the string `{{ other_var }}`, Ansible templates that value first, and you get `other_var`'s value. Gonja substitutes the text and moves on — the nested `{{ }}` stays raw. This one difference runs through the whole port, and it accounts for half the gotchas below.

Our five filters hit a detail: in the library version at the time, the filter set was assembled inside `New()` behind unexported fields, so you couldn't add your own without forking the package. We didn't want to carry a fork, so we sent upstream PR [#41](https://github.com/go-ansible/template/pull/41) — `RegisterFilter`, a thin delegation to gonja's `FilterSet`: an error on a duplicate name instead of a silent replacement, and register-before-first-render as the contract. The project's maintainer, [tannevaled](https://github.com/tannevaled), verified both claims against gonja's sources, noted in review that `Register` isn't atomic (`Exists` releases the lock before the write takes it — not our problem; we register once at startup from a single goroutine), and merged the PR on October 7, 2026. The API shipped in v0.33.0, which is what we moved to; the same review produced a companion, [#42](https://github.com/go-ansible/template/pull/42), adding `RegisterTest` — Jinja `is` tests live next to filters in Ansible, and that set was behind the same wall. The "register from one goroutine before rendering starts" contract is now [documented](https://go-ansible.github.io/docs/latest/components/template/#adding-a-filter-or-a-test-of-your-own), along with both APIs.

## Gotchas

### Recursive lookup and the fixed point

In Ansible, variable values are templated lazily, on lookup, however deeply they nest. Gonja does one pass. The fix: render until stable. For vars layers that's a fixed point, max 5 passes, like our merge_yaml:

```go
func (p *Pipeline) resolveLayer(layer map[string]any) {
	for i := 0; i < 5; i++ {
		resolved := walkTemplate(layer, p.scope(nil), nil, nil)
		out := resolved.(map[string]any)
		// Snapshot before mutating: layer and out can alias after a
		// pass, and comparing mutated state to itself stops the loop
		// after one pass, leaving chained refs half-resolved.
		stable := equalYAML(layer, out)
		for k, v := range out {
			layer[k] = v
		}
		if stable {
			return
		}
	}
}
```

The subtlety we stumbled on: snapshot before mutating. The layer and the pass result can alias the same map, and if you mutate the layer before comparing, you're comparing mutated state against itself — the loop exits after one pass, leaving chains of references half-resolved. The symptom was nasty: some values resolved, others didn't, depending on key order. The spec render itself uses the same trick, up to three iterations: references that surface in the output (say, `to_json` over a list containing vault references) resolve on the second pass.

### keep_raw, but not everywhere

The merged vars file was templated without `keep_raw`, and the merge_yaml semantic mismatch left unresolved references inside JSON: `to_json` serialized raw `{{ }}` before they had a chance to expand. The fix is precise placement: group variables template without `keep_raw` (in Ansible they expand freely at lookup), the merged file gets it, and vault names land in the keep_raw globs. Without reproducing these rules exactly, byte parity is out of reach.

### Panic on an empty raw block

Gonja panics (index out of range) on an empty `{% raw %}{% endraw %}` block — and we found such values in our corpus. A panic on one spec shouldn't take down the whole pipeline:

```go
func (p *Pipeline) safeRender(src string, scope map[string]any) (out string, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("template panic: %v", r)
		}
	}()
	return p.eng.Render(src, scope)
}
```

The panic becomes an error, and the spec lands in the FAIL set — exactly as in Ansible, where it fails with a proper message.

### trim_blocks

Ansible defaults to `trim_blocks=True`: the newline right after a block tag is swallowed. go-ansible/template doesn't expose the setting, and a single newline difference fails a byte-for-byte comparison. We emulate it with a text substitution, which also expands the `{{ '\n' }}` literal (gonja doesn't unescape string literals; three specs use it):

```go
trimBlocks := func(s string) string {
	s = strings.ReplaceAll(s, "{{ '\\n' }}", "\n")
	return strings.ReplaceAll(s, "%}\n", "%}")
}
```

Yes, it's crude. But Ansible's semantics here are textual too, and the substitution covers our corpus completely.

## Secrets: Base64 of the Ciphertext

Our secrets model: the env file contains no plaintext. A value ships to the host as base64 of the ansible-vault ciphertext (the `vault_base64` filter), and the service decrypts it itself. The renderer needs plaintext almost nowhere — except where a vault value participates in other templates.

In Go, we implemented ansible-vault 1.1 AES256 directly: PBKDF2-HMAC-SHA256 with 10,000 iterations yields an 80-byte key, split into the AES key, the HMAC key, and the IV:

```go
derived := pbkdf2.Key([]byte(password), salt, 10000, 80, sha256.New)
aesKey, hmacKey, iv := derived[:32], derived[32:64], derived[64:80]

mac := hmac.New(sha256.New, hmacKey)
mac.Write(data)
if !hmac.Equal(mac.Sum(nil), storedHMAC) {
	return "", fmt.Errorf("vault HMAC mismatch (wrong password?)")
}
stream := cipher.NewCTR(block, iv)
stream.XORKeyStream(plaintext, data)
```

It turned out simpler than wrangling subprocesses: a `VaultString` type with a `String()` method mirrors Ansible's `AnsibleVaultEncryptedUnicode` — rendering yields the plaintext, `vault_base64` consumes the ciphertext. All the vault machinery fits in one 140-line file, no Python at runtime.

## Parity and the Numbers

We didn't switch to the Go engine on faith. First, the pilot: the Go renderer was compared against the Ansible baseline byte for byte — 70 spec × environment pairs (production 23 + staging 47 — all the pairs where an Ansible render exists at all), zero diffs. In parallel: unit tests for byte-compatible filters and 11 tests for the diff-checker classification (IDENTICAL / DIFF / TREE-FAIL / BOTH-FAIL and the other verdicts). Only then did the default engine move to Go; Ansible stayed behind the `--engine ansible` flag as a fallback.

A useful side effect: parity made accumulated debt visible. The corpus had 20 specs stuck in BOTH-FAIL — historical failures the old pipeline silently skipped ("the baseline failed and the tree failed"). Some fall over on Ansible's lazy evaluation, some on gonja's inability to parse one for-loop. Now it's an explicit list, and we're fixing it in a separate wave.

The numbers themselves. A full gate run: ~80 minutes → ~3.5 seconds for all 85 specs across both environments. As an analogy, not a metric: a gate that used to run longer than it took the author to work through review comments now finishes while you type `git push`. In practice, render-check became a synchronous step of the MR: hit rerun, get an answer in seconds, and the edit-review loop stays unbroken. And the vars refactor this was all for finally got a safety net you can lean on a hundred times a day.

## What Mattered More Than the Speedup

When the numbers lined up, it turned out the numbers weren't the point. We started with a utilitarian goal — speed up one gating pipeline — and ended up with a working Go layer that reproduces Ansible's semantics on our corpus to the byte. Inventory, merge vars with a fixed point, vault, custom filters, the two-pass render — none of that is a "check script"; it's an SDK for our tooling.

That layer removes both taxes from earlier. Go drops the dependency on specific Python versions and module sets — on the CI runner and on target hosts alike. Resource usage falls by orders of magnitude: one process instead of hundreds of playbook runs. Writing your own module in Go is faster and more predictable than an Ansible plugin with its Python scaffolding, and the module brings observability into the deploy with it: structured logs and per-step metrics, which a playbook never really gives you.

Ansible as the way we organize things isn't going anywhere: roles, inventories, specs, the declarative model — they stay, and we never planned to change them. The executor is what changes. `template` is one of eight components of [go-ansible](https://go-ansible.github.io/), a third-party project: [its maintainer](https://github.com/tannevaled) is building it out into a full library with measured byte-for-byte parity (vault, inventory, vars, playbook, cli, and the rest). We're consumers of the SDK — two upstream PRs, nothing more. Templating was the first, most isolated, byte-verifiable piece; next on the same SDK, we plan application deploys and running the existing Ansible playbooks — without dragging a Python runtime along.

