# kshvakov.github.io

Source for my personal site at `https://kshvakov.github.io`, built with [Hugo](https://gohugo.io/) (RU/EN).

## Quick start

### Prerequisites

- [Hugo](https://gohugo.io/installation/) (recent version)

### Local development

```bash
make serve
```

Then open `http://localhost:1313`.

### Build & sanity check

```bash
make build
make check
```

Notes:
- `public/` and `resources/` are generated outputs and are gitignored (see `.gitignore`).
- Drafts (`draft: true`) are not built by default. To preview drafts locally, run:

```bash
hugo server -D
```

Also avoid linking published pages to drafts via Hugo `relref`/`ref`: it can break the build.

## Repository layout (high level)

```text
config.yaml                 # Hugo config (languages, params)
content/                    # Russian content
content/en/                 # English content
layouts/                    # Hugo templates (single/list/partials/shortcodes)
static/assets/              # CSS/JS and other static assets
Makefile                    # Common commands (serve/build/check/clean)
```

## Adding / editing content

- **Talks (RU)**: `content/talks/*.md`
- **Talks (EN)**: `content/en/talks/*.md`
- **Main pages**: `content/_index.md`, `content/en/_index.md`

### Talks with YouTube + transcript

Talk pages embed YouTube via a shortcode and can optionally load a plain-text transcript in the browser.

- **Transcript files**: `static/assets/transcripts/*.txt`
  - This directory is intentionally **gitignored** (see `.gitignore`).
  - If you want transcripts to be part of the repo, remove that ignore rule.

Example front matter fields you can use (adjust to your needs):

```markdown
---
title: "Talk title"
date: 2024-01-01
youtube_id: YOUR_YOUTUBE_ID
transcript: /assets/transcripts/YOUR_YOUTUBE_ID.en.txt
description: |
  Multi-line description.
---
```

## Deployment

Build output is generated with:

```bash
make build
```

Publish `public/` to GitHub Pages using your preferred workflow (GitHub Actions, external CI, or manual upload).
