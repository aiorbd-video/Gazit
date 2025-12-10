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
