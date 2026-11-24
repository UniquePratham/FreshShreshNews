// FreshShresh News — UI controller
//
// Keeps the original Bootstrap accordion layout and the original controls
// (country tabs, category / language / country / year dropdowns, search).
// Data comes from Js/feed.js, which needs no API key.

const FIRST_YEAR = 2020;
const CURRENT_YEAR = new Date().getFullYear();

const state = {
  country: "in",
  language: "en",
  category: "general",
  query: "",
  year: null, // null = latest headlines
};

const accordionNews = document.getElementById("accordionNews");
const categoryButton = document.getElementById("categoryButton");
const languageButton = document.getElementById("languageButton");
const countryButton = document.getElementById("countryButton");
const fromButton = document.getElementById("fromButton");
const yearMenu = document.getElementById("yearMenu");
const newsSearch = document.getElementById("newsSearch");
const submit = document.getElementById("submit");
const currentDate = document.getElementById("currentDate");

const LOADING = `<div class="d-flex justify-content-center py-5">
  <div class="spinner-border" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>`;

const EMPTY = `<div class="alert alert-warning my-4" role="alert">
  <strong>No stories found.</strong> Try another category, country, year or search word.
</div>`;

const ERROR = (message) => `<div class="alert alert-danger my-4" role="alert">
  <strong>Could not load the news feed.</strong> ${message}
  <div class="mt-2"><button class="btn btn-sm btn-outline-danger" id="retryFeed">Try again</button></div>
</div>`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// A photo fills the media slot. A publisher logo is a small square icon, so it
// is rendered as a badge next to the source instead of being stretched.
// The first article is expanded on load, so its photo is fetched eagerly.
function mediaHtml(article, index) {
  if (article.image && article.imageKind !== "logo") {
    return `<div class="news-media">
      <img src="${escapeHtml(article.image)}" alt="" loading="${index === 0 ? "eager" : "lazy"}"
           referrerpolicy="no-referrer"
           onerror="this.parentNode.classList.add('is-empty');this.remove()">
    </div>`;
  }
  return `<div class="news-media is-empty"><span>No photo</span></div>`;
}

function sourceBadge(article) {
  if (article.image && article.imageKind === "logo") {
    return `<img class="source-logo" src="${escapeHtml(article.image)}" alt=""
                 loading="lazy" referrerpolicy="no-referrer"
                 onerror="this.remove()">`;
  }
  return "";
}

function articleHtml(article, index) {
  const open = index === 0;
  const published = formatDate(article.publishedAt);

  // Publisher feeds often repeat the headline as the description. Showing it
  // twice is noise, so the duplicate is dropped. A prefix match catches the
  // common "headline + extra clause" shape too.
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const summary = norm(article.description);
  const title = norm(article.title);
  const isDuplicate =
    !summary ||
    summary === title ||
    summary.startsWith(title) ||
    title.startsWith(summary) ||
    summary.replace(/[^a-z0-9]/g, "") === title.replace(/[^a-z0-9]/g, "");

  return `
    <div class="accordion-item">
      <h2 class="accordion-header" id="heading${index}">
        <button class="accordion-button ${open ? "" : "collapsed"}" type="button"
                data-bs-toggle="collapse" data-bs-target="#collapse${index}"
                aria-expanded="${open}" aria-controls="collapse${index}">
          <b>${index + 1}.</b>
          <span>${escapeHtml(article.title)}</span>
        </button>
      </h2>
      <div id="collapse${index}" class="accordion-collapse collapse ${open ? "show" : ""}"
           aria-labelledby="heading${index}" data-bs-parent="#accordionNews">
        <div class="accordion-body news-split${isDuplicate ? " is-compact" : ""}">
          <div class="news-text">
            <p class="news-summary${isDuplicate ? " is-duplicate" : ""}">${escapeHtml(summary)}</p>
            <div class="news-meta">
              <a class="read-more" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
                <code>Read the full story</code>
              </a>
              <strong class="source-name">${sourceBadge(article)}Source: ${escapeHtml(article.source.name)}</strong>
              ${published ? `<strong>${escapeHtml(published)}</strong>` : ""}
            </div>
          </div>
          ${mediaHtml(article, index)}
        </div>
      </div>
    </div>`;
}

async function loadNews() {
  accordionNews.innerHTML = LOADING;
  try {
    const articles = await window.FreshShresh.fetchFeed({
      country: state.country,
      language: state.language,
      category: state.category,
      query: state.query,
      year: state.year,
    });

    if (!articles.length) {
      accordionNews.innerHTML = EMPTY;
      return;
    }

    accordionNews.innerHTML = articles.map(articleHtml).join("");
  } catch (err) {
    accordionNews.innerHTML = ERROR(escapeHtml(err.message));
    const retry = document.getElementById("retryFeed");
    if (retry) retry.addEventListener("click", loadNews);
  }
}

// --------------------------------------------------------------------------
// Year dropdown — 2020 .. current year, newest first
// --------------------------------------------------------------------------
function buildYearMenu() {
  if (!yearMenu) return;
  const clearItem = yearMenu.querySelector(".clear-filter");
  const divider = clearItem ? clearItem.closest("li").previousElementSibling : null;

  for (let year = CURRENT_YEAR; year >= FIRST_YEAR; year -= 1) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "from-item dropdown-item";
    a.id = String(year);
    a.textContent = year === CURRENT_YEAR ? `${year} (this year)` : String(year);
    li.appendChild(a);
    yearMenu.insertBefore(li, divider);
  }
}

function bindYearItems() {
  yearMenu.querySelectorAll("a.from-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const id = event.currentTarget.id;
      if (id === "all" || id === "latest") {
        state.year = null;
        fromButton.innerText = "Latest headlines";
      } else {
        state.year = parseInt(id, 10) || null;
        fromButton.innerText = `Year: ${id}`;
      }
      loadNews();
    });
  });
}

// --------------------------------------------------------------------------
// Country tabs
// --------------------------------------------------------------------------
const TABS = [
  ["Home", "in"],
  ["IN2", "in"],
  ["US2", "us"],
  ["AU2", "au"],
  ["NL2", "nl"],
  ["CH2", "ch"],
];

function setActiveTab(id) {
  TABS.forEach(([tabId]) => {
    const el = document.getElementById(tabId);
    if (el) el.classList.remove("active");
  });
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

TABS.forEach(([tabId, country]) => {
  const el = document.getElementById(tabId);
  if (!el) return;
  el.addEventListener("click", () => {
    state.country = country;
    state.query = "";
    setActiveTab(tabId);
    countryButton.innerText = "Choose Specific Country";
    loadNews();
  });
});

// Language tabs
[["HI2", "hi"], ["EN2", "en"]].forEach(([tabId, language]) => {
  const el = document.getElementById(tabId);
  if (!el) return;
  el.addEventListener("click", () => {
    state.language = language;
    state.query = "";
    setActiveTab(tabId);
    languageButton.innerText = "Choose Specific Language";
    loadNews();
  });
});

// --------------------------------------------------------------------------
// Dropdowns
// --------------------------------------------------------------------------
document.querySelectorAll("li > a.category-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    categoryButton.innerText = event.currentTarget.innerText;
    state.category = event.currentTarget.id.toLowerCase();
    state.query = "";
    loadNews();
  });
});

document.querySelectorAll("li > a.language-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    languageButton.innerText = event.currentTarget.innerText;
    state.language = event.currentTarget.id.toLowerCase().replace(/\d+$/, "");
    state.query = "";
    loadNews();
  });
});

document.querySelectorAll("li > a.country-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    countryButton.innerText = event.currentTarget.innerText;
    state.country = event.currentTarget.id.toLowerCase();
    state.query = "";
    loadNews();
  });
});

// --------------------------------------------------------------------------
// Search
// --------------------------------------------------------------------------
if (submit) {
  submit.addEventListener("click", (event) => {
    event.preventDefault();
    state.query = (newsSearch.value || "").trim();
    loadNews();
  });
}

if (newsSearch) {
  newsSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      state.query = (newsSearch.value || "").trim();
      loadNews();
    }
  });
}

// --------------------------------------------------------------------------
// Clock
// --------------------------------------------------------------------------
if (currentDate) {
  const tick = () => {
    currentDate.innerText = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  tick();
  setInterval(tick, 60_000);
}

// Clear-filter entries reset their own dimension and reload.
document.querySelectorAll("a.clear-filter").forEach((item) => {
  item.addEventListener("click", (event) => {
    const kind = event.currentTarget.className;
    if (kind.includes("category-item")) {
      state.category = "general";
      categoryButton.innerText = "Choose Specific Category";
    } else if (kind.includes("language-item")) {
      state.language = "en";
      languageButton.innerText = "Choose Specific Language";
    } else if (kind.includes("country-item")) {
      state.country = "in";
      countryButton.innerText = "Choose Specific Country";
    } else if (kind.includes("from-item")) {
      state.year = null;
      fromButton.innerText = "Latest headlines";
    }
    loadNews();
  });
});

buildYearMenu();
bindYearItems();
loadNews();
