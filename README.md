# Vercel HLS Proxy (bd71 lock)

## Files
- api/master.js  -> serves /master.m3u8 (rewrites playlists & segments)
- api/segment.js -> proxies .ts segments
- api/key.js     -> proxies encryption keys (if any)
- vercel.json    -> route mapping

## Deploy
1. Push to GitHub.
2. Import repo in Vercel and deploy (no build command needed).
3. Access playlist:
   - Default: `https://YOUR-VERCEL-DOMAIN/master.m3u8`
   - Dynamic: `https://YOUR-VERCEL-DOMAIN/master.m3u8?u=<ENCODED_M3U8_URL>`

## Security
Only accessible when the request `Origin` and `Referer` start with:
`https://bd71.vercel.app`

If not, a friendly HTML error is returned.

## Example
Use in HLS.js on bd71.vercel.app:
```js
hls.loadSource("https://saath-tau.vercel.app/master.m3u8?u=" + encodeURIComponent("https://app24.jagobd.com.bd/.../mono.m3u8"));
hls.attachMedia(video);
---

## Deploy notes / troubleshooting
- **Origin/Referer:** Make sure your player page is served from `https://bd71.vercel.app` so browser sends correct headers. If you serve locally (`http://localhost:8080`) Origin will fail.
- **CORS:** Proxy adds `Access-Control-Allow-Origin: https://bd71.vercel.app` on responses.
- **Large segments:** The code uses `arrayBuffer()` — works fine for typical segment sizes. If you want streaming passthrough (lower RAM), I can convert to streaming implementation.
- **Timeouts / cold starts:** Vercel serverless has time limits—if upstream is slow, may fail. Consider caching headers or edge functions for heavy load.
- **If 403 appears:** Confirm Referer/Origin exactly matches (including trailing slash differences). Browser often sets `referer` including the page path — our code checks `startsWith(ALLOWED)` so `https://bd71.vercel.app/anything` is fine.

---

