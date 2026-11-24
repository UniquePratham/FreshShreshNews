// FreshShresh News — UI controller
//
// Keeps the original Bootstrap accordion layout and the original controls
// (country tabs, category / language / country / date dropdowns, search).
// Data now comes from Js/feed.js, which needs no API key.

const state = {
  country: "in",
  language: "en",
  category: "general",
  query: "",
  fromYear: null,
};

const accordionNews = document.getElementById("accordionNews");
const categoryButton = document.getElementById("categoryButton");
const languageButton = document.getElementById("languageButton");
const countryButton = document.getElementById("countryButton");
const fromButton = document.getElementById("fromButton");
const newsSearch = document.getElementById("newsSearch");
const submit = document.getElementById("submit");
const currentDate = document.getElementById("currentDate");

const LOADING = `<div class="d-flex justify-content-center py-5">
  <div class="spinner-border" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>`;

const EMPTY = `<div class="alert alert-warning my-4" role="alert">
  <strong>No stories found.</strong> Try another category, country or search word.
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

function articleHtml(article, index) {
  const open = index === 0;
  const published = formatDate(article.publishedAt);
  const image = article.image
    ? `<div class="news-media">
         <img src="${escapeHtml(article.image)}" alt="" loading="lazy"
              onerror="this.closest(' .news-media').classList.add('is-empty')">
       </div>`
    : `<div class="news-media is-empty"><span>No image</span></div>`;

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
        <div class="accordion-body news-split">
          <div class="news-text">
            <p class="news-summary">${escapeHtml(article.description)}</p>
            <div class="news-meta">
              <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
                <code>Read the full story</code>
              </a>
              <strong>Source: ${escapeHtml(article.source.name)}</strong>
              ${published ? `<strong>${escapeHtml(published)}</strong>` : ""}
            </div>
          </div>
          ${image}
        </div>
      </div>
    </div>`;
}

async function loadNews() {
  accordionNews.innerHTML = LOADING;
  try {
    let articles = await window.FreshShresh.fetchFeed({
      country: state.country,
      language: state.language,
      category: state.category,
      query: state.query,
    });

    // Google News RSS has no date range, so the year filter is applied
    // client-side against each article's published date.
    if (state.fromYear) {
      articles = articles.filter((a) => {
        const d = new Date(a.publishedAt)
        return !Number.isNaN(d.getTime()) && d.getFullYear() >= state.fromYear
      })
    }

    if (!articles.length) {
      accordionNews.innerHTML = EMPTY
      return
    }

    accordionNews.innerHTML = articles.map(articleHtml).join("")
  } catch (err) {
    accordionNews.innerHTML = ERROR(escapeHtml(err.message))
    const retry = document.getElementById("retryFeed")
    if (retry) retry.addEventListener("click", loadNews)
  }
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
    categoryButton.innerText = event.target.innerText;
    state.category = event.target.id.toLowerCase();
    state.query = "";
    loadNews();
  });
});

document.querySelectorAll("li > a.language-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    languageButton.innerText = event.target.innerText;
    state.language = event.target.id.toLowerCase().replace(/\d+$/, "");
    state.query = "";
    loadNews();
  });
});

document.querySelectorAll("li > a.country-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    countryButton.innerText = event.target.innerText;
    state.country = event.target.id.toLowerCase();
    state.query = "";
    loadNews();
  });
});

document.querySelectorAll("li > a.from-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    const id = event.target.id;
    fromButton.innerText = event.target.innerText;

    if (id === "all") {
      state.fromYear = null;
      fromButton.innerText = "Any date";
    } else if (id === "week") {
      state.fromYear = null;
    } else {
      state.fromYear = parseInt(id, 10) || null;
    }

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
    const kind = event.target.className
    if (kind.includes("category-item")) {
      state.category = "general"
      categoryButton.innerText = "Choose Specific Category"
    } else if (kind.includes("language-item")) {
      state.language = "en"
      languageButton.innerText = "Choose Specific Language"
    } else if (kind.includes("country-item")) {
      state.country = "in"
      countryButton.innerText = "Choose Specific Country"
    } else if (kind.includes("from-item")) {
      state.fromYear = null
      fromButton.innerText = "Any date"
    }
    loadNews()
  })
})


loadNews();
