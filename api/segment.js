// api/segment.js
const ALLOWED = "https://bd71.vercel.app";

function forbiddenHtmlSegment() {
  return `
  <!doctype html><html><head><meta charset="utf-8"/><title>Access Denied</title></head>
  <body style="font-family:Arial;text-align:center;padding:40px;">
    <h1 style="color:#b00;">⛔ Segment Access Denied</h1>
    <p>Allowed site: <strong>${ALLOWED}</strong></p>
  </body></html>`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(403).send(forbiddenHtmlSegment());
  }

  const raw = req.query.u;
  if (!raw) return res.status(400).send("Missing segment URL");

  const url = decodeURIComponent(raw);

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).send("Upstream segment error");

    const buf = Buffer.from(await r.arrayBuffer());

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "video/mp2t");
    // optional caching - tune if you want
    // res.setHeader("Cache-Control", "public, max-age=6");
    return res.send(buf);
  } catch (err) {
    console.error("segment error:", err);
    return res.status(500).send("Segment Proxy Error");
  }
}
