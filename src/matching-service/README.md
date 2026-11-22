# Matching service

This directory contains the Node.js/Express MVP matching service.

It exposes `GET /health` and `POST /internal/rank`. The ranking endpoint
accepts a candidate ID, excludes every card the candidate already swiped, and
scores remaining published cards from shared fixed-vocabulary tags. It sorts
by score and then by publication date. The backend calls it through an HTTP
timeout of one second and uses most-recent-first if it is unavailable.

Ranking inputs use only candidate/card tags and swipe/card IDs. Protected
attributes and photos are never queried or accepted.

## Commands

```powershell
npm ci
npm run build
npm start
```

The service requires `MATCHING_DATABASE_URL` or `DATABASE_URL`. Request IDs
may be propagated with `X-Request-ID`.
