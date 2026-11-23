// FreshShresh News — data layer
//
// Headlines come from Google News RSS via our own serverless proxy
// (/api/news), which converts the feed to JSON server-side. No API key is
// needed and there is no CORS problem because the browser only talks to our
// own origin.
//
// The previous build used gnews.io with a hardcoded key that had expired, so
// every request failed. This module keeps the same article shape the UI
// expects (title, description, content, url, image, source, publishedAt).

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

  const res = await fetch(`/api/news?${params.toString()}`);
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