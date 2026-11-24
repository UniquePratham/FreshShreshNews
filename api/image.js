// api/image.js — image proxy for FreshShresh News.
//
// Historical articles get their photo from Bing image search, which returns the
// publisher's own CDN URL. Several of those CDNs send
// `Cross-Origin-Resource-Policy: same-origin`, so the browser refuses to render
// them on our domain (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin) even though the
// bytes are public. Fetching server-side and re-serving them sidesteps that.
//
// Only http(s) URLs are accepted, and the response is streamed with a long
// cache so a given photo is fetched once.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|webp|gif|avif)$/i;
const MAX_BYTES = 6 * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const raw = String(req.query.url || "");
  let target;
  try {
    target = new URL(raw);
  } catch {
    return res.status(400).json({ error: "Invalid url" });
  }
  if (!/^https?:$/.test(target.protocol)) {
    return res.status(400).json({ error: "Only http(s) is allowed" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": UA, Accept: "image/*,*/*" },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream returned ${upstream.status}` });
    }

    const type = upstream.headers.get("content-type") || "";
    if (!ALLOWED_TYPES.test(type)) {
      return res.status(415).json({ error: "Not an image" });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: "Image too large" });
    }

    res.setHeader("Content-Type", type);
    res.setHeader("Content-Length", String(buffer.length));
    // Photos never change, so let the CDN hold them for a week.
    res.setHeader("Cache-Control", "public, max-age=604800, s-maxage=604800, immutable");
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  } finally {
    clearTimeout(timer);
  }
}
