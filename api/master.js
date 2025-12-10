// api/master.js
const ALLOWED = "https://bd71.vercel.app";

function forbiddenHtml() {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>Access Denied</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>
        body{font-family:Inter,system-ui,Arial,sans-serif;background:#fafafa;color:#222;margin:0}
        .wrap{max-width:720px;margin:8vh auto;padding:28px;text-align:center;border-radius:12px;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,0.06)}
        h1{color:#e11; margin:0 0 12px}
        p{margin:8px 0 16px;color:#444}
        .domain{font-weight:700;color:#111}
        a.button{display:inline-block;padding:10px 16px;background:#0b79f7;color:#fff;border-radius:8px;text-decoration:none;margin-top:8px}
      </style>
    </head>
    <body>
      <div class="wrap">
        <h1>⛔ Access Denied</h1>
        <p>This stream is restricted. Allowed origin / referer:</p>
        <div class="domain">${ALLOWED}</div>
        <p>If you are the site owner, open the player from the allowed domain.</p>
        <a class="button" href="${ALLOWED}" target="_blank" rel="noreferrer">Go to allowed site</a>
      </div>
    </body>
  </html>
  `;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // Strict Origin + Referer check
  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(403).send(forbiddenHtml());
  }

  // Default target = your JagoBD link (provided by you)
  const defaultTarget = "https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/gazibdz.stream/tracks-v1a1/mono.m3u8";

  const rawU = req.query.u;
  const target = rawU ? decodeURIComponent(rawU) : defaultTarget;

  try {
    const upstream = await fetch(target);
    if (!upstream.ok) return res.status(502).send("Upstream playlist error");

    const text = await upstream.text();
    const base = new URL(target).href.replace(/[^\/]+$/, ""); // base for relative resolves

    // rewrite logic:
    const out = text.split(/\r?\n/).map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;           // preserve blank
      if (trimmed.startsWith("#EXT-X-KEY")) {
        // rewrite any URI="..." inside EXT-X-KEY
        const m = trimmed.match(/URI=(?:\"([^\"]+)\"|([^,]+))/i);
        if (m && (m[1] || m[2])) {
          const keyUrl = new URL((m[1]||m[2]).replace(/^"/,"").replace(/"$/,""), base).href;
          const proxied = `/api/key?u=${encodeURIComponent(keyUrl)}`;
          return trimmed.replace(/URI=(?:\"([^\"]+)\"|([^,]+))/i, `URI="${proxied}"`);
        }
        return line;
      }
      if (trimmed.startsWith("#")) return line; // other tags unchanged

      // resource line -> resolve absolute
      try {
        const abs = new URL(trimmed, base).href;

        if (abs.toLowerCase().includes(".m3u8")) {
          // nested playlist -> point to same public master endpoint
          return `/master.m3u8?u=${encodeURIComponent(abs)}`;
        }

        if (abs.toLowerCase().match(/\.ts($|\?)/i)) {
          return `/api/segment?u=${encodeURIComponent(abs)}`;
        }

        // fallback: return as absolute original (some lines may be subtitles, etc.)
        return abs;
      } catch (e) {
        return line;
      }
    }).join("\n");

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    return res.status(200).send(out);

  } catch (err) {
    console.error("master error:", err);
    return res.status(500).send("Playlist Error");
  }
}
