# FreshShresh News

A news reader that pulls live headlines from Google News. Pick a country,
category or language, or search for a word — the accordion updates in place.

**Live:** <https://freshshreshnews.web.app> (Firebase Hosting)
**Mirror:** <https://freshshreshnews.vercel.app> (Vercel)

## How it works

The browser calls a serverless proxy that fetches the Google News RSS feed,
converts it to JSON and returns it. No API key is required and there is no
CORS problem, because the proxy sends `access-control-allow-origin: *`.

```
browser  →  /api/news?country=in&language=en&category=general  →  Google News RSS
```

The proxy runs on **Vercel**. Firebase Hosting is static-only, and Cloud
Functions requires the Blaze plan, so the static site is served by Firebase
and the API stays on Vercel. `Js/feed.js` points at the Vercel endpoint; set
`window.FRESHSHRESH_API` before the script loads to override it.

## Features

- Country tabs: India, United States, Australia, Netherlands, Switzerland
- Language tabs: Hindi, English
- Category dropdown: General, Business, Technology, Sports, Entertainment,
  Health, Science, Nation, World
- Country dropdown: 30 editions
- Search by keyword
- Live date in the navbar

## Project layout

```
index.html        markup and Bootstrap layout
style.css         the original styling
Js/feed.js        data layer — calls the news API, normalises the articles
Js/app2.js        UI controller — tabs, dropdowns, search, accordion rendering
api/news.js       serverless proxy: RSS → JSON, 5-minute cache (Vercel)
firebase.json     Firebase Hosting config
vercel.json       Vercel routes for the API
```

## Deploying

**Firebase Hosting** (the static site):

```bash
firebase deploy --only hosting --project freshshreshnews
```

**Vercel** (the API and a mirror of the site):

```bash
npx vercel deploy --prod
```

## Running locally

```bash
npx vercel dev
# open http://localhost:3000
```

A plain static server will not work: `/api/news` needs the serverless function.

## Notes

- Headlines are Google News' own selection for the chosen edition.
- The "Within a Week" control is kept for parity with the original UI; Google
  News RSS does not expose a date range, so the newest stories are shown.
- Responses are cached for 5 minutes at the edge.

## License

MIT — see [LICENSE](LICENSE).