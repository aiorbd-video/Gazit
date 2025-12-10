const ALLOWED = "https://bd71.vercel.app";

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
    return res.status(403).send("Segment Access Denied");
  }

  const raw = req.query.u;
  if (!raw) return res.status(400).send("Missing segment URL");
  const url = decodeURIComponent(raw);

  try {
    const upstream = await fetch(url);
    const buf = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "video/mp2t");
    return res.send(buf);

  } catch {
    return res.status(500).send("Segment Error");
  }
}
