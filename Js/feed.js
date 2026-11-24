// FreshShresh News — data layer
//
// Headlines come from Google News RSS via a serverless proxy that converts
// the feed to JSON. No API key is needed. The proxy runs on Vercel because
// Firebase Hosting is static-only and Cloud Functions requires the Blaze
// plan; it sends `access-control-allow-origin: *`, so any host can call it.
//
// The previous build used gnews.io with a hardcoded key that had expired, so
// every request failed. This module keeps the same article shape the UI
// expects (title, description, content, url, image, source, publishedAt).

// Override with window.FRESHSHRESH_API if the API moves.
const NEWS_API =
  (typeof window !== "undefined" && window.FRESHSHRESH_API) ||
  "https://freshshreshnews.vercel.app/api/news";

function stripHtml(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed({ country, language, category, query }) {
  const params = new URLSearchParams({
    country: country || "in",
    language: language || "en",
    category: category || "general",
  });
  if (query) params.set("q", query);

  // The news API lives on Vercel (Firebase Hosting is static-only and Cloud
  // Functions needs the Blaze plan). The endpoint sends
  // `access-control-allow-origin: *`, so the browser can call it from any host.
  const res = await fetch(`${NEWS_API}?${params.toString()}`);
  if (!res.ok) {
    let detail = `Feed request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) detail = body.error;
    } catch {
      /* keep the status message */
    }
    throw new Error(detail);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map((item) => ({
    title: stripHtml(item.title) || "No title available",
    description: stripHtml(item.description) || "No description available.",
    content: stripHtml(item.content) || "No description available.",
    url: item.url || "#",
    image: item.image || "",
    source: { name: (item.source && item.source.name) || "Google News" },
    publishedAt: item.publishedAt || "",
  }));
}

window.FreshShresh = { fetchFeed };