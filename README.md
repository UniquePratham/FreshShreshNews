# FreshShresh News

A news reader that pulls live headlines from Google News. Pick a country,
category or language, or search for a word — the accordion updates in place.

**Live:** <https://freshshreshnews.vercel.app>

## How it works

The browser calls `/api/news`, a serverless function that fetches the Google
News RSS feed, converts it to JSON and returns it. No API key is required and
there is no CORS problem, because the browser only talks to our own origin.

```
browser  →  /api/news?country=in&language=en&category=general  →  Google News RSS
```

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
Js/feed.js        data layer — calls /api/news, normalises the articles
Js/app2.js        UI controller — tabs, dropdowns, search, accordion rendering
api/news.js       serverless proxy: RSS → JSON, with a 5-minute cache
vercel.json       routes /api/news to the function, everything else static
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