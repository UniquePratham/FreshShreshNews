// api/news.js — news proxy for FreshShresh News.
//
// Two data paths, chosen by the request:
//
//   1. Live headlines (no year, or the current year) come from a registry of
//      publisher RSS feeds. Those feeds carry real article photos, which the
//      Google News RSS feed does not — it ships no <img>, <media:content> or
//      <enclosure> at all, and its links are news.google.com redirects whose
//      og:image is a generic Google placeholder.
//
//   2. Historical years (2020 .. last year) come from Google News search with
//      an `after:`/`before:` range, because publisher feeds only expose the
//      last few days. Those results have no photo, so the publisher favicon is
//      returned with `imageKind: "logo"` and the UI renders it as a source
//      badge instead of stretching a 32px icon across a photo slot.
//
// No API key is required for either path.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FEED_TIMEOUT_MS = 7000;
const MAX_ITEMS = 40;
const PER_FEED = 12;
// Below this many illustrated articles, keep the unillustrated ones too rather
// than returning a near-empty page.
const MIN_PHOTO_ITEMS = 6;

// ---------------------------------------------------------------------------
// Publisher feed registry
//
// Every entry below was verified to return items that carry an image. Feeds
// that answered 403/404 or shipped no image tags were dropped rather than
// shipped as a silent empty state.
// ---------------------------------------------------------------------------
const FEEDS = [
  // India — general
  { c: "in", g: "general", n: "The Hindu", u: "https://www.thehindu.com/news/national/feeder/default.rss" },
  { c: "in", g: "general", n: "The Indian Express", u: "https://indianexpress.com/section/india/feed/" },
  { c: "in", g: "general", n: "Hindustan Times", u: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml" },
  { c: "in", g: "general", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms" },
  { c: "in", g: "general", n: "NDTV", u: "https://feeds.feedburner.com/ndtvnews-top-stories" },
  { c: "in", g: "general", n: "News18", u: "https://www.news18.com/rss/india.xml" },
  { c: "in", g: "general", n: "India Today", u: "https://www.indiatoday.in/rss/1206578" },
  { c: "in", g: "nation", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms" },
  { c: "in", g: "world", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms" },
  // India — business
  { c: "in", g: "business", n: "Business Standard", u: "https://www.business-standard.com/rss/home_page_top_stories.rss" },
  { c: "in", g: "business", n: "The Hindu BusinessLine", u: "https://www.thehindubusinessline.com/feeder/default.rss" },
  { c: "in", g: "business", n: "Mint", u: "https://www.livemint.com/rss/news" },
  { c: "in", g: "business", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms" },
  // India — technology
  { c: "in", g: "technology", n: "Economic Times Tech", u: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms" },
  { c: "in", g: "technology", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms" },
  // India — sports
  { c: "in", g: "sports", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms" },
  { c: "in", g: "sports", n: "NDTV Sports", u: "https://feeds.feedburner.com/ndtvsports-latest" },
  { c: "in", g: "sports", n: "ESPNcricinfo", u: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml" },
  // India — entertainment
  { c: "in", g: "entertainment", n: "Bollywood Hungama", u: "https://www.bollywoodhungama.com/rss/news.xml" },
  { c: "in", g: "entertainment", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms" },
  { c: "in", g: "entertainment", n: "NDTV Movies", u: "https://feeds.feedburner.com/ndtvmovies-latest" },
  // India — health / science
  { c: "in", g: "health", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/3908999.cms" },
  { c: "in", g: "science", n: "The Times of India", u: "https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms" },

  // India — Hindi
  { c: "in", g: "general", l: "hi", n: "NDTV Khabar", u: "https://feeds.feedburner.com/ndtvkhabar-latest" },
  { c: "in", g: "general", l: "hi", n: "Dainik Bhaskar", u: "https://www.bhaskar.com/rss-feed/1061/" },

  // United States
  { c: "us", g: "general", n: "The New York Times", u: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { c: "us", g: "general", n: "NPR", u: "https://feeds.npr.org/1001/rss.xml" },
  { c: "us", g: "general", n: "ABC News", u: "https://abcnews.go.com/abcnews/topstories" },
  { c: "us", g: "general", n: "NBC News", u: "https://feeds.nbcnews.com/nbcnews/public/news" },
  { c: "us", g: "business", n: "MarketWatch", u: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
  { c: "us", g: "business", n: "Fortune", u: "https://fortune.com/feed/" },
  { c: "us", g: "business", n: "Forbes", u: "https://www.forbes.com/business/feed/" },
  { c: "us", g: "technology", n: "Wired", u: "https://www.wired.com/feed/rss" },
  { c: "us", g: "technology", n: "Ars Technica", u: "https://feeds.arstechnica.com/arstechnica/index" },
  { c: "us", g: "technology", n: "Engadget", u: "https://www.engadget.com/rss.xml" },
  { c: "us", g: "sports", n: "CBS Sports", u: "https://www.cbssports.com/rss/headlines/" },
  { c: "us", g: "sports", n: "Yahoo Sports", u: "https://sports.yahoo.com/rss/" },
  { c: "us", g: "science", n: "Space.com", u: "https://www.space.com/feeds/all" },
  { c: "us", g: "science", n: "Live Science", u: "https://www.livescience.com/feeds/all" },
  { c: "us", g: "health", n: "NPR Health", u: "https://feeds.npr.org/1128/rss.xml" },
  { c: "us", g: "health", n: "Healthline", u: "https://www.healthline.com/rss/health-news" },
  { c: "us", g: "entertainment", n: "Variety", u: "https://variety.com/feed/" },

  // United Kingdom
  { c: "gb", g: "general", n: "BBC News", u: "https://feeds.bbci.co.uk/news/rss.xml" },
  { c: "gb", g: "general", n: "Sky News", u: "https://feeds.skynews.com/feeds/rss/world.xml" },
  { c: "gb", g: "general", n: "The Independent", u: "https://www.independent.co.uk/news/world/rss" },
  { c: "gb", g: "business", n: "BBC News", u: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { c: "gb", g: "technology", n: "BBC News", u: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { c: "gb", g: "sports", n: "BBC Sport", u: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { c: "gb", g: "science", n: "BBC News", u: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
  { c: "gb", g: "health", n: "BBC News", u: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  { c: "gb", g: "entertainment", n: "BBC News", u: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },

  // Australia
  { c: "au", g: "general", n: "ABC News", u: "https://www.abc.net.au/news/feed/51120/rss.xml" },
  { c: "au", g: "general", n: "The Sydney Morning Herald", u: "https://www.smh.com.au/rss/feed.xml" },
  { c: "au", g: "general", n: "The Age", u: "https://www.theage.com.au/rss/feed.xml" },

  // Netherlands
  { c: "nl", g: "general", n: "NOS", u: "https://feeds.nos.nl/nosnieuwsalgemeen" },
  { c: "nl", g: "general", n: "DutchNews.nl", u: "https://www.dutchnews.nl/feed/" },

  // Switzerland
  { c: "ch", g: "general", n: "NZZ", u: "https://www.nzz.ch/recent.rss" },
  { c: "ch", g: "general", n: "Tages-Anzeiger", u: "https://www.tagesanzeiger.ch/rss.html" },
  { c: "ch", g: "general", n: "Blick", u: "https://www.blick.ch/rss.xml" },

  // Canada
  { c: "ca", g: "general", n: "CBC", u: "https://www.cbc.ca/webfeed/rss/rss-topstories" },
  { c: "ca", g: "general", n: "The Globe and Mail", u: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/?outputType=xml" },
  { c: "ca", g: "general", n: "Global News", u: "https://globalnews.ca/feed/" },

  // France
  { c: "fr", g: "general", n: "France 24", u: "https://www.france24.com/en/rss" },
  { c: "fr", g: "general", n: "Le Monde", u: "https://www.lemonde.fr/rss/une.xml" },
  { c: "fr", g: "general", n: "RFI", u: "https://www.rfi.fr/en/rss" },
  { c: "fr", g: "general", n: "Le Figaro", u: "https://www.lefigaro.fr/rss/figaro_actualites.xml" },

  // Germany
  { c: "de", g: "general", n: "Der Spiegel", u: "https://www.spiegel.de/international/index.rss" },
  { c: "de", g: "general", n: "Die Zeit", u: "https://newsfeed.zeit.de/index" },
  { c: "de", g: "general", n: "FAZ", u: "https://www.faz.net/rss/aktuell/" },

  // Spain
  { c: "es", g: "general", n: "El País", u: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada" },
  { c: "es", g: "general", n: "El Mundo", u: "https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml" },

  // Japan
  { c: "jp", g: "general", n: "The Japan Times", u: "https://www.japantimes.co.jp/feed/" },

  // China / Hong Kong
  { c: "cn", g: "general", n: "SCMP", u: "https://www.scmp.com/rss/91/feed" },
  { c: "hk", g: "general", n: "SCMP", u: "https://www.scmp.com/rss/2/feed" },

  // Singapore
  { c: "sg", g: "general", n: "CNA", u: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml" },

  // Pakistan
  { c: "pk", g: "general", n: "The Express Tribune", u: "https://tribune.com.pk/feed/home" },

  // Ireland
  { c: "ie", g: "general", n: "The Irish Times", u: "https://www.irishtimes.com/arc/outboundfeeds/rss/?outputType=xml" },
  { c: "ie", g: "general", n: "RTÉ", u: "https://www.rte.ie/feeds/rss/?index=/news/" },

  // Israel
  { c: "il", g: "general", n: "The Times of Israel", u: "https://www.timesofisrael.com/feed/" },

  // Ukraine
  { c: "ua", g: "general", n: "Ukrinform", u: "https://www.ukrinform.net/rss/block-lastnews" },

  // Norway
  { c: "no", g: "general", n: "NRK", u: "https://www.nrk.no/toppsaker.rss" },

  // Sweden
  { c: "se", g: "general", n: "Dagens Nyheter", u: "https://www.dn.se/rss/" },
  { c: "se", g: "general", n: "Aftonbladet", u: "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/" },

  // Philippines
  { c: "ph", g: "general", n: "Inquirer", u: "https://newsinfo.inquirer.net/feed" },
  { c: "ph", g: "general", n: "Rappler", u: "https://www.rappler.com/feed/" },

  // Peru
  { c: "pe", g: "general", n: "El Comercio", u: "https://elcomercio.pe/arcio/rss/" },

  // Nigeria
  { c: "ng", g: "general", n: "Punch", u: "https://punchng.com/feed/" },

  // Bangladesh
  { c: "bd", g: "general", n: "The Daily Star", u: "https://www.thedailystar.net/rss.xml" },

  // UAE / Saudi Arabia
  { c: "ae", g: "general", n: "The National", u: "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml" },
  { c: "sa", g: "general", n: "Arab News", u: "https://www.arabnews.com/rss.xml" },

  // Vietnam
  { c: "vn", g: "general", n: "VnExpress", u: "https://e.vnexpress.net/rss/news.rss" },

  // Brazil
  { c: "br", g: "general", n: "UOL", u: "https://rss.uol.com.br/feed/noticias.xml" },

  // Greece
  { c: "gr", g: "general", n: "iefimerida", u: "https://www.iefimerida.gr/rss.xml" },

  // Portugal
  { c: "pt", g: "general", n: "Observador", u: "https://observador.pt/feed/" },

  // Romania
  { c: "ro", g: "general", n: "Adevărul", u: "https://adevarul.ro/rss/" },

  // Russia
  { c: "ru", g: "general", n: "Meduza", u: "https://meduza.io/rss/en/all" },
];

// Google News editions, used for the historical-year path and as a fallback
// when a country has no publisher feed in the registry.
const EDITIONS = new Set([
  "IN", "US", "AU", "NL", "CH", "GB", "BR", "CA", "CN", "EG", "FR", "DE",
  "GR", "HK", "IE", "IL", "IT", "JP", "NO", "PK", "PE", "PH", "PT", "RO",
  "RU", "SG", "ES", "SE", "TW", "UA",
]);

const TOPICS = new Set([
  "WORLD", "NATION", "BUSINESS", "TECHNOLOGY", "SPORTS", "ENTERTAINMENT",
  "HEALTH", "SCIENCE",
]);

// Country name used as the search keyword for the "general" category when a
// historical year is requested (Google News search needs a term, not a range).
const COUNTRY_TERM = {
  in: "India", us: "United States", au: "Australia", nl: "Netherlands",
  ch: "Switzerland", gb: "United Kingdom", br: "Brazil", ca: "Canada",
  cn: "China", eg: "Egypt", fr: "France", de: "Germany", gr: "Greece",
  hk: "Hong Kong", ie: "Ireland", il: "Israel", it: "Italy", jp: "Japan",
  no: "Norway", pk: "Pakistan", pe: "Peru", ph: "Philippines", pt: "Portugal",
  ro: "Romania", ru: "Russia", sg: "Singapore", es: "Spain", se: "Sweden",
  tw: "Taiwan", ua: "Ukraine",
};

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------
function decodeEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&amp;/g, "&");
}

function stripTags(value) {
  return decodeEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function absoluteUrl(url, base) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!base) return "";
  try {
    return new URL(raw, base).toString();
  } catch {
    return "";
  }
}

// Pull the best available image out of one RSS <item>.
function extractImage(block, base) {
  const candidates = [];

  for (const m of block.matchAll(/<media:content\b([^>]*)>/gi)) {
    const attrs = m[1];
    const url = attrs.match(/url=["']([^"']+)["']/i);
    if (!url) continue;
    const width = Number((attrs.match(/width=["'](\d+)["']/i) || [])[1] || 0);
    const type = (attrs.match(/type=["']([^"']+)["']/i) || [])[1] || "";
    if (type && !/^image\//i.test(type)) continue;
    candidates.push({ url: url[1], width });
  }

  for (const m of block.matchAll(/<media:thumbnail\b([^>]*)>/gi)) {
    const url = m[1].match(/url=["']([^"']+)["']/i);
    if (!url) continue;
    const width = Number((m[1].match(/width=["'](\d+)["']/i) || [])[1] || 0);
    candidates.push({ url: url[1], width });
  }

  for (const m of block.matchAll(/<enclosure\b([^>]*)>/gi)) {
    const attrs = m[1];
    const url = attrs.match(/url=["']([^"']+)["']/i);
    if (!url) continue;
    const type = (attrs.match(/type=["']([^"']+)["']/i) || [])[1] || "";
    if (type && !/^image\//i.test(type)) continue;
    candidates.push({ url: url[1], width: 0 });
  }

  const newsImage = block.match(/<News:Image>([^<]+)<\/News:Image>/i);
  if (newsImage) candidates.push({ url: newsImage[1], width: 0 });

  const inline = block.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (inline) candidates.push({ url: inline[1], width: 0 });

  // Prefer the widest candidate; fall back to the first usable one.
  const usable = candidates
    .map((c) => ({ ...c, url: absoluteUrl(c.url, base) }))
    .filter((c) => c.url && !/\.svg(\?|$)/i.test(c.url));

  if (!usable.length) return "";
  usable.sort((a, b) => b.width - a.width);
  return usable[0].url;
}

function tokens(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2)
  );
}

function matchesQuery(title, queryTokens) {
  if (!queryTokens.size) return true;
  const titleTokens = tokens(title);
  for (const t of queryTokens) if (titleTokens.has(t)) return true;
  return false;
}

function dedupeKey(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 90);
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------
async function fetchText(url, { retries = 0 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
        signal: controller.signal,
      });
      if (res.ok) return await res.text();
      // 429/503 from Google News is a rate limit, not a permanent failure.
      if (attempt < retries && (res.status === 429 || res.status >= 500)) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return null;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function parseFeed(xml, feed) {
  const items = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = re.exec(xml)) !== null && items.length < PER_FEED) {
    const block = match[1];
    const title = stripTags(pick(block, "title"));
    if (!title) continue;

    const link = pick(block, "link") || pick(block, "guid");
    const description = stripTags(pick(block, "description"));
    const publishedAt = pick(block, "pubDate") || pick(block, "dc:date");

    items.push({
      title,
      description: description || "No description available.",
      content: description || "No description available.",
      url: absoluteUrl(link, feed.u) || "#",
      image: extractImage(block, feed.u),
      imageKind: "photo",
      source: { name: feed.n },
      publishedAt,
    });
  }
  return items;
}

function faviconFor(domain) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Google News RSS: used for historical years and as a last-resort fallback.
function parseGoogleNews(xml) {
  const items = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const block = match[1];
    const rawTitle = stripTags(pick(block, "title"));
    if (!rawTitle) continue;

    // Google appends " - Publisher" to every headline.
    const idx = rawTitle.lastIndexOf(" - ");
    const title = idx > 20 ? rawTitle.slice(0, idx) : rawTitle;
    const sourceTag = block.match(/<source\b[^>]*url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/source>/i);
    const sourceName = sourceTag ? stripTags(sourceTag[2]) : idx > 20 ? rawTitle.slice(idx + 3) : "Google News";
    const sourceDomain = sourceTag ? domainOf(sourceTag[1]) : "";

    const description = stripTags(pick(block, "description"));

    items.push({
      title,
      description: description || "No description available.",
      content: description || "No description available.",
      url: pick(block, "link") || "#",
      image: faviconFor(sourceDomain),
      imageKind: "logo",
      source: { name: sourceName || "Google News" },
      publishedAt: pick(block, "pubDate"),
    });
  }
  return items;
}

function googleNewsUrl({ country, language, category, query, year }) {
  const gl = EDITIONS.has(country) ? country : "IN";
  const hl = language || "en";
  const ceid = `${gl}:${hl}`;
  const base = "https://news.google.com/rss";

  if (year) {
    const term =
      query ||
      (category && category !== "general" && category !== "nation"
        ? category
        : COUNTRY_TERM[gl.toLowerCase()] || gl);
    const q = `${term} after:${year}-01-01 before:${year + 1}-01-01`;
    return `${base}/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
  }

  if (query) {
    return `${base}/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
  }
  if (TOPICS.has(category)) {
    return `${base}/headlines/section/topic/${category}?hl=${hl}&gl=${gl}&ceid=${ceid}`;
  }
  return `${base}?hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

function sortByDateDesc(items) {
  return items.sort((a, b) => {
    const ta = Date.parse(a.publishedAt) || 0;
    const tb = Date.parse(b.publishedAt) || 0;
    return tb - ta;
  });
}

function finalize(items, query) {
  const queryTokens = tokens(query);
  const seen = new Set();
  const out = [];
  for (const item of sortByDateDesc(items)) {
    if (!matchesQuery(item.title, queryTokens)) continue;
    const key = dedupeKey(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= MAX_ITEMS) break;
  }

  // A feed where half the cards show "No photo" looks broken. When enough
  // articles carry a real photo, drop the rest so every card is illustrated.
  const withPhoto = out.filter((i) => i.image && i.imageKind === "photo");
  if (withPhoto.length >= MIN_PHOTO_ITEMS) return withPhoto;

  return out;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const country = String(req.query.country || "in").toUpperCase();
  const language = String(req.query.language || "en").toLowerCase();
  const category = String(req.query.category || "general").toUpperCase();
  const query = String(req.query.q || "").trim();
  const yearParam = parseInt(req.query.year, 10);
  const currentYear = new Date().getFullYear();
  const year =
    Number.isFinite(yearParam) && yearParam >= 2020 && yearParam <= currentYear
      ? yearParam
      : null;

  const gl = country.toLowerCase();
  const cat = category.toLowerCase();

  try {
    // Historical years: publisher feeds only carry the last few days, so the
    // archive has to come from Google News search with an explicit range.
    if (year && year < currentYear) {
      const xml = await fetchText(
        googleNewsUrl({ country, language, category: cat, query, year }),
        { retries: 2 }
      );
      if (!xml) return res.status(502).json({ error: "Upstream news search failed" });
      const items = finalize(parseGoogleNews(xml), query);
      return res.status(200).json({ count: items.length, year, items });
    }

    // Live path: publisher feeds that carry real photos.
    let feeds = FEEDS.filter((f) => f.c === gl && f.g === cat);
    if (language !== "en") {
      const localized = feeds.filter((f) => f.l === language);
      if (localized.length) feeds = localized;
    }
    if (!feeds.length) {
      // No registry entry for this country/category — use the general feeds.
      feeds = FEEDS.filter((f) => f.c === gl && f.g === "general");
    }

    if (feeds.length) {
      const xmls = await Promise.all(feeds.map((f) => fetchText(f.u)));
      const items = [];
      xmls.forEach((xml, i) => {
        if (xml) items.push(...parseFeed(xml, feeds[i]));
      });

      let result = finalize(items, query);

      // A search that matches nothing in the live feeds falls through to
      // Google News so the user still gets an answer.
      if (!result.length && query) {
        const xml = await fetchText(
          googleNewsUrl({ country, language, category: cat, query, year: null }),
          { retries: 1 }
        );
        if (xml) result = finalize(parseGoogleNews(xml), query);
      }

      if (result.length) {
        return res.status(200).json({ count: result.length, year: year || null, items: result });
      }
    }

    // Fallback: Google News RSS (source logos instead of photos).
    const xml = await fetchText(
      googleNewsUrl({ country, language, category: cat, query, year: null }),
      { retries: 2 }
    );
    if (!xml) return res.status(502).json({ error: "Upstream news feed failed" });
    const items = finalize(parseGoogleNews(xml), query);
    return res.status(200).json({ count: items.length, year: year || null, items });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
