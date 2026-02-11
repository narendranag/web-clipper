# ✂ Web Clipper

A bookmarklet that lets you clip passages from any webpage, save them to your GitHub Pages site, and (coming soon) email them to subscribers.

## How It Works

1. **Select text** on any page in Chrome or Safari
2. **Click the bookmarklet** in your bookmarks bar
3. An overlay appears with your clip, source info, and an optional note field
4. **Save** — sends the clip to a Cloudflare Worker, which commits it to your GitHub repo

## Project Structure

```
web-clipper/
├── index.html          # Bookmarklet installer page
├── worker/
│   ├── index.js        # Cloudflare Worker (receives clips, commits to GitHub)
│   ├── wrangler.toml   # Worker config
│   └── README.md       # Worker setup guide
└── _clips/             # Where clips get saved (created automatically)
```

## Quick Start

1. **Deploy the worker** — see [`worker/README.md`](worker/README.md) for full setup
2. **Install the bookmarklet** — open `index.html`, configure your worker URL + auth token, drag to bookmarks bar
3. **Start clipping** — select text on any page, click ✂ Clip, hit Save

## Architecture

```
Bookmarklet (select text + URL)
    ↓
Cloudflare Worker (authenticates, formats)
    ↓
GitHub API (commits markdown file to _clips/)
    ↓
GitHub Pages (rebuilds site automatically)
    ↓
Email distribution (coming soon)
```

## Clip Data Format

Each clip is saved as a markdown file with YAML front matter:

```markdown
---
layout: clip
date: 2025-02-11T14:30:00.000Z
source_url: https://example.com/article
source_title: "Article Title"
source_domain: example.com
---

> The clipped passage appears here as a blockquote.

Your optional note goes here.

— [Article Title](https://example.com/article)
```
