# Fransis Hangout

A small site for a friend group's KakaoTalk chat. The first feature is a date poll for a group trip: every friend marks each candidate day as preferred, available or unavailable, and the site shows which days work best. No login: the poll link is the access secret.

The site is the source of truth. KakaoTalk is only used to hand the link around; nothing is read from it.

Specs and tickets live in `.scratch/date-poll/`.

The workflow skills under `.claude/skills/` are modified copies of [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, see `.claude/skills/LICENSE-mattpocock-skills.txt`).

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

Friends join a poll by name, with no login: they open `/p/<id>` and type a name (at most 20 characters, unique within the poll ignoring case, surrounding spaces and Hangul composition form; at most 30 people per poll). The browser remembers the join on that device.

After joining, a friend marks each candidate day as preferred (★), available (○) or unavailable (✕) by tapping it (a day left untouched is "no answer", never "unavailable") and saves. Saving replaces all of that person's previous answers in one transaction, and only the holder of the edit token that was issued at join time can change them. The token travels in an `Authorization: Bearer` header, never in the URL.

After the first save, the page shows the respondent's personal edit link (`/p/<id>#edit=<respondent id>.<edit token>`) with a copy button. Opening it in any browser restores edit access to that respondent's answers only. The token sits after the `#`, which browsers never send to the server or in the Referer header, and the page removes it from the address bar once handled. Anyone holding the link can change that person's answers, so the page tells people to keep it private. A wrong or truncated link shows an error and changes nothing.

Anyone with the link can read the results (`GET /api/polls/<id>/results`, no token): per day, the names who chose preferred, available or unavailable and how many have not answered, plus "M of N answered" and a ranking of candidate days. The ranking orders days by fewest unavailable, then most preferred, then most available, then earliest date. A day nobody answered is never ranked. A day is flagged unanimous when at least one person answered it and everyone who did chose preferred or available. The page loads results when it opens (no live updates) and reloads them right after you join or save.

## Test

```sh
npm test            # API tests: requests go in through the HTTP API, a real local D1 is used
npm run typecheck   # worker, tests and frontend
```

Tests run at one seam: the HTTP API. The database is built from the real migrations in `migrations/`. The test setup clears every table before each test, and `test/harness.test.ts` checks that no data leaks from one test to the next. (Without that cleanup, data from earlier tests was visible in later ones.)

## Deploy

You need a free Cloudflare account and `npx wrangler login` once.

```sh
# 1. Set the production organizer key (prompted, never echoed). Creates the Worker if it does not exist yet.
npx wrangler secret put ORGANIZER_KEY

# 2. Build and deploy. The first deploy also creates the D1 database named in wrangler.jsonc.
npm run deploy

# 3. Create the tables in the production database (first deploy, and after adding a migration).
npx wrangler d1 migrations apply fransis-hangout-db --remote
```

`wrangler deploy` prints the site's default `workers.dev` address. Per-version preview URLs are turned off in `wrangler.jsonc`, so that is the only address.

Create the first poll against the production address with the same `curl` as above, using the production key. In zsh, `read -s "KEY?Organizer key: "` stores it without showing it.

## Conventions

- Dates are plain calendar dates (`YYYY-MM-DD`) with no time zone, so a day never shifts with the viewer's device settings.
- The API reports errors as stable codes (for example `PERIOD_TOO_LONG`). The frontend maps codes to text in `web/i18n/`.
- Every response carries `X-Robots-Tag: noindex, nofollow`, and `robots.txt` disallows crawling, so poll links stay out of search results.
- The organizer key is a secret (`wrangler secret put ORGANIZER_KEY` in production). If it is missing or empty, creating polls is refused.
