# ✂ Web Clipper

A bookmarklet that lets you clip passages from any webpage and save them — with source URL, title, and your own notes.

## How It Works

1. **Select text** on any page in Chrome or Safari
2. **Click the bookmarklet** in your bookmarks bar
3. An overlay appears with your clip, source info, and an optional note field
4. **Save** — sends the clip to your API (or copies JSON to clipboard in preview mode)

## Setup

1. Open `index.html` in your browser
2. Drag the **✂ Clip** button to your bookmarks bar
3. (Optional) Configure your API endpoint and auth token, then click "Regenerate Bookmarklet"

## Architecture

This is the first piece of a larger pipeline:

```
Bookmarklet (you are here)
    ↓
Cloudflare Worker (receives clip, authenticates)
    ↓
GitHub API (commits clip as markdown)
    ↓
GitHub Pages (rebuilds site)
    ↓
Email distribution (Buttondown / Resend)
```

## Preview Mode

With no API configured, the bookmarklet copies clip data as JSON to your clipboard — useful for testing the flow before wiring up the backend.

## Clip Data Format

```json
{
  "text": "The selected passage...",
  "note": "Your optional commentary",
  "url": "https://example.com/article",
  "title": "Article Title",
  "domain": "example.com",
  "clipped_at": "2025-02-11T..."
}
```
