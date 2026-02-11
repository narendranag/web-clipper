/**
 * Web Clipper — Cloudflare Worker
 *
 * Receives clips from the bookmarklet and commits them
 * as markdown files to your GitHub Pages repo.
 *
 * Environment variables (set via wrangler secret):
 *   AUTH_TOKEN    — shared secret the bookmarklet sends
 *   GITHUB_TOKEN  — GitHub personal access token (repo scope)
 *   GITHUB_REPO   — e.g. "narendranag/web-clipper"
 *   GITHUB_BRANCH — e.g. "main"
 */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return corsResponse(jsonResponse({ error: 'Method not allowed' }, 405));
    }

    // Authenticate
    const auth = request.headers.get('Authorization');
    if (!auth || auth !== `Bearer ${env.AUTH_TOKEN}`) {
      return corsResponse(jsonResponse({ error: 'Unauthorized' }, 401));
    }

    try {
      const clip = await request.json();

      // Validate required fields
      if (!clip.text || !clip.url) {
        return corsResponse(jsonResponse({ error: 'Missing text or url' }, 400));
      }

      // Generate a slug and filename
      const timestamp = clip.clipped_at || new Date().toISOString();
      const date = timestamp.slice(0, 10); // YYYY-MM-DD
      const slug = slugify(clip.title || clip.domain || 'clip');
      const filename = `_clips/${date}-${slug}.md`;

      // Build the markdown content
      const markdown = buildMarkdown(clip, timestamp);

      // Commit to GitHub
      const result = await commitToGitHub(env, filename, markdown, clip.title || clip.url);

      return corsResponse(jsonResponse({
        ok: true,
        file: filename,
        sha: result.content?.sha,
        url: result.content?.html_url,
      }, 201));

    } catch (err) {
      return corsResponse(jsonResponse({ error: err.message }, 500));
    }
  },
};

// ─── Helpers ───────────────────────────────────────────

function buildMarkdown(clip, timestamp) {
  const date = timestamp.slice(0, 10);
  const time = timestamp.slice(11, 16);

  // YAML front matter for Jekyll / static site generators
  let md = `---\n`;
  md += `layout: clip\n`;
  md += `date: ${timestamp}\n`;
  md += `source_url: ${clip.url}\n`;
  md += `source_title: "${escapeYaml(clip.title || '')}"\n`;
  md += `source_domain: ${clip.domain || ''}\n`;
  md += `---\n\n`;

  // The clipped passage as a blockquote
  md += `> ${clip.text.replace(/\n/g, '\n> ')}\n\n`;

  // Optional note
  if (clip.note) {
    md += `${clip.note}\n\n`;
  }

  // Source link
  md += `— [${clip.title || clip.domain || clip.url}](${clip.url})\n`;

  return md;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function escapeYaml(str) {
  return str.replace(/"/g, '\\"');
}

async function commitToGitHub(env, path, content, title) {
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const token = env.GITHUB_TOKEN;

  // Base64 encode the content
  const encoded = btoa(unescape(encodeURIComponent(content)));

  // Check if file already exists (to get its sha for updates)
  let existingSha = null;
  const checkUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
  const checkRes = await fetch(checkUrl, {
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'web-clipper-worker',
    },
  });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    existingSha = existing.sha;
  }

  // Create or update the file
  const putUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const body = {
    message: `clip: ${title || path}`,
    content: encoded,
    branch: branch,
  };
  if (existingSha) {
    body.sha = existingSha;
  }

  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'web-clipper-worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${err}`);
  }

  return res.json();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function corsResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
