# 01: Create a poll and open it by link (walking skeleton)

**What to build:** The thinnest complete path through every layer. The organizer creates a poll (title, start date, end date) using the organizer key. Anyone with the poll link opens it in a browser and sees the title and the candidate period, in Korean. The site is deployed to the default free Cloudflare address, is hidden from search engines, and has an API test harness that runs against a real local D1 database. This ticket also fixes the conventions every later ticket follows: all user-facing text comes from translation files, and API errors are stable codes that the frontend maps to text.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The organizer can create a poll with a title, start date and end date when the organizer key is supplied; the response contains an unguessable public identifier
- [x] Creating a poll without the organizer key, or with a wrong key, is rejected with a stable error code and nothing is stored
- [x] Creation is rejected, with distinct error codes, for: end date before start date, a period longer than 92 days, an empty title, and an overlong title
- [x] Opening the poll link shows the title and the period; an unknown identifier shows a clear "poll not found" state rather than a crash
- [x] Dates are handled as plain calendar dates with no time zone: the displayed dates never shift with the viewer's device settings
- [x] Every user-facing string (including the page title and error messages) comes from a Korean translation file keyed by locale; no literal user-facing text appears in the screens
- [x] API errors are returned as stable machine-readable codes; the frontend maps each code to a Korean message
- [x] Responses signal "do not index" and the site disallows crawling
- [ ] API tests run against a real local D1 database, starting clean for each test, and cover every creation rule above (tests run against a real local D1 and cover every creation rule; a clean database per test relies on the plugin's per-test isolation and is not yet proven by a test - ticket 02's name-uniqueness tests will exercise it)
- [x] The site is deployed to the default Cloudflare address and the poll link works there; the organizer key is a deployment secret, not committed to the repository
- [x] The README states in English how to run the site and the tests locally and how it is deployed
