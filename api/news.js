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


// Map a publisher name to its domain so we can fetch a real favicon.
const PUBLISHER_DOMAINS = {
  "the hindu": "thehindu.com",
  "the times of india": "timesofindia.indiatimes.com",
  "times of india": "timesofindia.indiatimes.com",
  "the indian express": "indianexpress.com",
  "indian express": "indianexpress.com",
  "hindustan times": "hindustantimes.com",
  "ndtv": "ndtv.com",
  "bbc": "bbc.com",
  "bbc news": "bbc.com",
  "the guardian": "theguardian.com",
  "guardian": "theguardian.com",
  "reuters": "reuters.com",
  "associated press": "apnews.com",
  "ap news": "apnews.com",
  "al jazeera": "aljazeera.com",
  "cnn": "cnn.com",
  "the new york times": "nytimes.com",
  "new york times": "nytimes.com",
  "the washington post": "washingtonpost.com",
  "washington post": "washingtonpost.com",
  "the economic times": "economictimes.indiatimes.com",
  "economic times": "economictimes.indiatimes.com",
  "business standard": "business-standard.com",
  "mint": "livemint.com",
  "livemint": "livemint.com",
  "the telegraph": "telegraphindia.com",
  "telegraph": "telegraphindia.com",
  "deccan herald": "deccanherald.com",
  "the wire": "thewire.in",
  "scroll.in": "scroll.in",
  "firstpost": "firstpost.com",
  "news18": "news18.com",
  "india today": "indiatoday.in",
  "the quint": "thequint.com",
  "the print": "theprint.in",
  "the federal": "thefederal.com",
  "the statesman": "thestatesman.com",
  "the pioneer": "dailypioneer.com",
  "tribune": "tribuneindia.com",
  "the tribune": "tribuneindia.com",
  "the week": "theweek.in",
  "outlook": "outlookindia.com",
  "the better india": "thebetterindia.com",
  "the news minute": "thenewsminute.com",
  "the hans india": "thehansindia.com",
  "the new indian express": "newindianexpress.com",
  "new indian express": "newindianexpress.com",
  "the free press journal": "freepressjournal.in",
  "free press journal": "freepressjournal.in",
  "mid-day": "mid-day.com",
  "the asian age": "asianage.com",
  "asian age": "asianage.com",
  "the sentinel": "sentinelassam.com",
  "the shillong times": "theshillongtimes.com",
  "the kashmir monitor": "thekashmirmonitor.net",
  "greater kashmir": "greaterkashmir.com",
  "rising kashmir": "risingkashmir.com",
  "the morung express": "morungexpress.com",
  "the navhind times": "navhindtimes.in",
  "the goan": "thegoan.net",
  "the hitavada": "hitavada.com",
  "the times of india (toi)": "timesofindia.indiatimes.com",
  "the hindu business line": "thehindubusinessline.com",
  "business line": "thehindubusinessline.com",
  "the hindu businessline": "thehindubusinessline.com",
  "the federal post": "thefederal.com",
  "the daily guardian": "thedailyguardian.com",
  "the sunday guardian": "sundayguardianlive.com",
  "the morning standard": "themorningstandard.com",
  "the pioneer daily": "dailypioneer.com",
  "the indian panorama": "indianpanorama.news",
  "the siasat daily": "siasat.com",
  "the hindu tamil": "thehindu.com",
  "the hindu telugu": "thehindu.com",
  "the hindu kannada": "thehindu.com",
  "the hindu malayalam": "thehindu.com",
  "the hindu hindi": "thehindu.com",
  "the hindu businessline": "thehindubusinessline.com",
  "the hindu news": "thehindu.com",
  "the hindu today": "thehindu.com",
  "the hindu live": "thehindu.com",
  "the hindu update": "thehindu.com",
  "the hindu latest": "thehindu.com",
  "the hindu breaking": "thehindu.com",
  "the hindu world": "thehindu.com",
  "the hindu india": "thehindu.com",
  "the hindu sports": "thehindu.com",
  "the hindu business": "thehindu.com",
  "the hindu technology": "thehindu.com",
  "the hindu science": "thehindu.com",
  "the hindu health": "thehindu.com",
  "the hindu entertainment": "thehindu.com",
  "the hindu nation": "thehindu.com",
  "the hindu general": "thehindu.com",
  "the hindu top": "thehindu.com",
  "the hindu stories": "thehindu.com",
  "the hindu news today": "thehindu.com",
  "the hindu news live": "thehindu.com",
  "the hindu news update": "thehindu.com",
  "the hindu news latest": "thehindu.com",
  "the hindu news breaking": "thehindu.com",
  "the hindu news world": "thehindu.com",
  "the hindu news india": "thehindu.com",
  "the hindu news sports": "thehindu.com",
  "the hindu news business": "thehindu.com",
  "the hindu news technology": "thehindu.com",
  "the hindu news science": "thehindu.com",
  "the hindu news health": "thehindu.com",
  "the hindu news entertainment": "thehindu.com",
  "the hindu news nation": "thehindu.com",
  "the hindu news general": "thehindu.com",
  "the hindu news top": "thehindu.com",
  "the hindu news stories": "thehindu.com",
};

function faviconFor(source) {
  const key = String(source || "").toLowerCase().trim();
  const domain = PUBLISHER_DOMAINS[key];
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }
  // Unknown publisher: fall back to a neutral news glyph.
  return "";
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
    const rawDescription = pick(block, "description");
    const summary = stripTags(rawDescription);

    // Google News RSS carries no article images, and its links are
    // news.google.com redirects. Use the publisher name from the title to
    // build a favicon URL, which identifies the source at a glance.
    const image = faviconFor(source)
    items.push({
      title: title || "No title available",
      description: summary || "No description available.",
      content: summary || "No description available.",
      url: pick(block, "link"),
      image,
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
