# Cloudflare Worker Setup

## Prerequisites

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
3. A GitHub Personal Access Token with `repo` scope

## Install Wrangler

```bash
npm install -g wrangler
```

## Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window. Log in and authorize Wrangler.

## Create your GitHub token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "web-clipper"
4. Select the `repo` scope (full control of private repositories)
5. Generate and copy the token

## Set secrets

From the `worker/` directory:

```bash
cd worker

# Your GitHub personal access token
wrangler secret put GITHUB_TOKEN
# Paste your token when prompted

# A shared secret for authenticating the bookmarklet
# Pick any random string (e.g. generate one with: openssl rand -hex 32)
wrangler secret put AUTH_TOKEN
# Paste your chosen secret when prompted
```

## Deploy

```bash
wrangler deploy
```

Wrangler will output your worker URL, something like:
```
https://web-clipper.YOUR-SUBDOMAIN.workers.dev
```

## Configure the bookmarklet

1. Open `index.html` in your browser
2. Enter your worker URL in the **API Endpoint** field
3. Enter the same AUTH_TOKEN value in the **Auth Token** field
4. Click **Regenerate Bookmarklet**
5. Drag the updated bookmarklet to your bookmarks bar

## Test it

1. Go to any article
2. Select some text
3. Click the ✂ Clip bookmarklet
4. Hit Save
5. Check your GitHub repo — a new file should appear in `_clips/`

## How it works

```
Bookmarklet → POST clip JSON → Cloudflare Worker → GitHub Contents API → new markdown file in _clips/
```

The worker:
- Validates the auth token
- Builds a markdown file with YAML front matter
- Commits it to your repo via the GitHub API
- GitHub Pages rebuilds automatically

## File format

Each clip creates a file like `_clips/2025-02-11-article-title.md`:

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

## Troubleshooting

**401 Unauthorized**: Check that your bookmarklet's auth token matches the `AUTH_TOKEN` secret.

**GitHub API errors**: Make sure your `GITHUB_TOKEN` has `repo` scope and the `GITHUB_REPO` in `wrangler.toml` matches your actual repo (format: `username/repo-name`).

**CORS errors**: The worker includes CORS headers by default. If you're still seeing issues, check the browser console for details.
