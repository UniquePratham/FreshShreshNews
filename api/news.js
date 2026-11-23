// api/news.js — serverless proxy for the Google News RSS feed.
//
// The browser cannot call feed2json.org directly (no CORS header), so this
// function fetches the RSS server-side, converts it to JSON and returns it
// with a permissive CORS header. No API key is required.

const ALLOWED_TOPICS = new Set([
  "WORLD",
  "NATION",
  "BUSINESS",
  "TECHNOLOGY",
  "SPORTS",
  "ENTERTAINMENT",
  "HEALTH",
  "SCIENCE",
]);

const EDITIONS = new Set([
  "IN", "US", "AU", "NL", "CH", "GB", "BR", "CA", "CN", "EG", "FR", "DE",
  "GR", "HK", "IE", "IL", "IT", "JP", "NO", "PK", "PE", "PH", "PT", "RO",
  "RU", "SG", "ES", "SE", "TW", "UA",
]);

function decodeEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripTags(value) {
  return decodeEntities(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function pick(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const block = match[1];
    const rawTitle = stripTags(pick(block, "title"));
    const idx = rawTitle.lastIndexOf(" - ");
    const title = idx > 20 ? rawTitle.slice(0, idx) : rawTitle;
    const source = idx > 20 ? rawTitle.slice(idx + 3) : "Google News";
    const summary = stripTags(pick(block, "description"));

    items.push({
      title: title || "No title available",
      description: summary || "No description available.",
      content: summary || "No description available.",
      url: pick(block, "link"),
      image: "",
      source: { name: source },
      publishedAt: pick(block, "pubDate"),
    });
  }
  return items;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const country = String(req.query.country || "in").toUpperCase();
  const language = String(req.query.language || "en").toLowerCase();
  const category = String(req.query.category || "general").toUpperCase();
  const query = String(req.query.q || "").trim();

  const gl = EDITIONS.has(country) ? country : "IN";
  const ceid = `${gl}:${language}`;
  const base = "https://news.google.com/rss";

  let rssUrl;
  if (query) {
    rssUrl = `${base}/search?q=${encodeURIComponent(query)}&hl=${language}&gl=${gl}&ceid=${ceid}`;
  } else if (ALLOWED_TOPICS.has(category)) {
    rssUrl = `${base}/headlines/section/topic/${category}?hl=${language}&gl=${gl}&ceid=${ceid}`;
  } else {
    rssUrl = `${base}?hl=${language}&gl=${gl}&ceid=${ceid}`;
  }

  try {
    const upstream = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FreshShreshNews/1.0)" },
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream returned ${upstream.status}` });
    }
    const xml = await upstream.text();
    const items = parseItems(xml);
    return res.status(200).json({ count: items.length, items });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}