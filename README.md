# Fransis Hangout

A small site for a friend group's KakaoTalk chat. The first feature is a date poll for a group trip: every friend marks each candidate day as preferred, available or unavailable, and the site shows which days work best. No login: the poll link is the access secret.

The site is the source of truth. KakaoTalk is only used to hand the link around; nothing is read from it.

Specs and tickets live in `.scratch/date-poll/`.

## Stack

- Cloudflare Workers with static assets (one deployment serves the pages and the API)
- Cloudflare D1 (SQLite) for storage
- [Hono](https://hono.dev) for routing, TypeScript throughout
- Vite for the static frontend (no UI framework yet)
- Vitest with `@cloudflare/vitest-plugin` for API tests against a real local D1

The UI is Korean. Every user-facing string lives in `web/i18n/`, so another language is a new file with the same shape as `ko.ts`.

## Requirements

Node.js 22.12 or newer (Wrangler 4 requires it) and npm. Developed on Node 26.

## Run locally

```sh
npm install

# Local-only organizer key. This file is git-ignored.
echo "ORGANIZER_KEY=choose-any-local-secret" > .dev.vars

# Create the local database tables (first run, and after adding a migration).
npx wrangler d1 migrations apply fransis-hangout-db --local

npm run dev   # builds the frontend, then serves everything on http://localhost:8787
```

## Create a poll

Polls are created through the API with the organizer key (there is no creation form yet):

```sh
curl -X POST http://localhost:8787/api/polls \
  -H "authorization: Bearer $ORGANIZER_KEY" \
  -H "content-type: application/json" \
  -d '{"title":"Winter trip","startDate":"2026-12-01","endDate":"2027-01-31"}'
```

The response contains the poll's public `id`. Share `/p/<id>` with the group. A poll can span at most 92 days (both ends counted) and its title at most 60 characters.

## Test

```sh
npm test            # API tests: requests go in through the HTTP API, a real local D1 is used
npm run typecheck   # worker, tests and frontend
```

Tests run at one seam: the HTTP API. Each test starts with a clean database built from the real migrations in `migrations/`.

## Conventions

- Dates are plain calendar dates (`YYYY-MM-DD`) with no time zone, so a day never shifts with the viewer's device settings.
- The API reports errors as stable codes (for example `PERIOD_TOO_LONG`). The frontend maps codes to text in `web/i18n/`.
- Every response carries `X-Robots-Tag: noindex, nofollow`, and `robots.txt` disallows crawling, so poll links stay out of search results.
- The organizer key is a secret (`wrangler secret put ORGANIZER_KEY` in production). If it is missing or empty, creating polls is refused.
