// api/master.js
const ALLOWED = "https://bd71.vercel.app";

function errorHtml() {
  return `
  <!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Access Denied</title>
  <style>
    body{font-family:Arial;text-align:center;padding-top:60px;background:#fafafa}
    .box{display:inline-block;padding:25px 40px;background:#fff;border-radius:12px;
         box-shadow:0 4px 20px rgba(0,0,0,.1)}
    h1{color:#d00;margin-bottom:10px}
    p{color:#444;font-size:17px}
    .domain{color:#000;font-weight:bold}
  </style>
  </head><body>
    <div class="box">
      <h1>⛔ Access Denied</h1>
      <p>This stream only works from:</p>
      <p class="domain">${ALLOWED}</p>
    </div>
  </body></html>`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
    res.setHeader("Content-Type", "text/html");
    return res.status(403).send(errorHtml());
  }

  // NEW DEFAULT STREAM (your request)
  const DEFAULT_STREAM =
    "https://cloudfrontnet.vercel.app/tplay/playout/209622/master.m3u8";

  const raw = req.query.u;
  const target = raw ? decodeURIComponent(raw) : DEFAULT_STREAM;

  try {
    const upstream = await fetch(target);
    if (!upstream.ok) return res.status(502).send("Playlist Load Error");

    const text = await upstream.text();
    const base = target.replace(/[^\/]+$/, "");

    const rewritten = text.split("\n").map(line => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return line;

      let abs;
      try {
        abs = new URL(t, base).href;
      } catch {
        return line;
      }

      if (abs.endsWith(".m3u8")) {
        return `/master.m3u8?u=${encodeURIComponent(abs)}`;
      }
      if (abs.endsWith(".ts")) {
        return `/api/segment?u=${encodeURIComponent(abs)}`;
      }
      if (t.includes("URI=")) {
        return `/api/key?u=${encodeURIComponent(abs)}`;
      }

      return abs;
    }).join("\n");

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(rewritten);

  } catch (err) {
    return res.status(500).send("Master Error");
  }
}
