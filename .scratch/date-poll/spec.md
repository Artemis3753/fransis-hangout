Status: ready-for-agent

# Spec: Date poll for the Fransis group trip

## Problem Statement

A group of about ten friends who share a KakaoTalk group chat wants to plan a trip in December or January. Today, finding a date that works means scrolling through a chat where people reply "I can do the 12th" or "not that weekend" in free text. Nobody can see, at a glance, which days work for most people, who has not answered yet, or which days are good enough to commit to. The group wants a first date decided within about three days, so the tool has to be usable almost immediately, without anyone creating an account.

## Solution

A small web page that the group opens from a link shared in the KakaoTalk chat. The page shows a day-by-day calendar covering the candidate period. Each friend enters their name once and marks each day as **preferred (선호)**, **available (가능)** or **unavailable (불가능)**. The page shows, for every day, how many people chose each state and who they are, and highlights the best candidate days. The organizer can close the poll and mark the final dates once the group agrees.

There is no login. The poll link is the access secret, search engines are told not to index it, and each respondent gets a personal edit link so they can change their own answers later from any device. The site is the source of truth: nothing is read from KakaoTalk. KakaoTalk is only used to hand the link around. The interface is Korean first, with every user-facing string held in translation files from the start so English can be added later without touching the screens.

## User Stories

### Organizer: setting up and running the poll

1. As the organizer, I want to create a poll with a title and a start and end date, so that my friends only see the period we are actually considering.
2. As the organizer, I want the period capped at a sensible maximum length, so that the calendar stays readable on a phone.
3. As the organizer, I want poll creation protected by a secret only I know, so that someone who gets the link cannot create or change polls.
4. As the organizer, I want a poll link that cannot be guessed, so that only people I send it to can open the poll.
5. As the organizer, I want a button that copies the poll link, so that I can paste it into the KakaoTalk group chat in one step.
6. As the organizer, I want the link to show a clear title and description when pasted into KakaoTalk, so that friends recognize what it is before tapping.
7. As the organizer, I want to see who has answered and who has not, so that I know whom to nudge in the chat.
8. As the organizer, I want to remove a respondent, so that a person who mistyped their name or lost their edit link can start over.
9. As the organizer, I want to close the poll, so that answers stop changing once we have decided.
10. As the organizer, I want to mark the confirmed date range when I close the poll, so that everyone sees the decision at the top of the page.
11. As the organizer, I want to reopen a closed poll, so that I can recover if we close it by mistake or the plan falls through.
12. As the organizer, I want the poll to cap the number of respondents, so that a leaked link cannot flood the page.

### Respondent: answering

13. As a friend, I want to open the link on my phone and see the calendar immediately, so that I can answer in under a minute.
14. As a friend, I want to enter just a name, so that I do not have to sign up or log in.
15. As a friend, I want to be told if my name is already taken, so that I do not overwrite someone else's answers by accident.
16. As a friend, I want names compared without regard to case or surrounding spaces, so that "Minji" and " minji " do not become two people.
17. As a friend, I want to tap a day to cycle through preferred, available, unavailable and no answer, so that marking many days is fast.
18. As a friend, I want a way to mark a whole weekend or a range of days at once, so that I do not have to tap every single day.
19. As a friend, I want days I have not marked to stay "no answer" rather than count as unavailable, so that my silence is not mistaken for a refusal.
20. As a friend, I want each state to be distinguishable by more than color, so that the calendar is readable for people who cannot tell the colors apart.
21. As a friend, I want to save all my answers with one action, so that I do not lose half of them.
22. As a friend, I want a clear confirmation after saving, so that I know my answers were recorded.
23. As a friend, I want an error message in Korean that says what went wrong, so that I can fix it without asking the organizer.
24. As a friend, I want my answers to stay marked when I come back later on the same device, so that I do not have to start over.

### Respondent: editing later

25. As a friend, I want a personal edit link after my first save, so that I can change my answers from any device or browser.
26. As a friend, I want the edit link to be shown with a one-tap copy button, so that I can save it in my own memo or chat.
27. As a friend, I want to change my answers from the same device without needing the link, so that the common case needs no extra step.
28. As a friend, I want nobody else to be able to change my answers, so that I can trust the numbers the group sees.
29. As a friend, I want to be told clearly when I open the poll in a browser that does not know me, so that I understand why I cannot edit and what to do.
30. As a friend, I want to be unable to change answers after the poll is closed, so that the agreed dates stay stable.

### Everyone: reading the results

31. As a friend, I want to see, for every day, how many people are preferred, available, unavailable and have not answered, so that I can judge each day at a glance.
32. As a friend, I want to tap a day and see the names behind each state, so that I know exactly who can and cannot come.
33. As a friend, I want the best candidate days highlighted and ranked, so that I do not have to do the math myself.
34. As a friend, I want days where everyone who answered is available or preferred to stand out, so that obvious winners are obvious.
35. As a friend, I want to see how many people have answered out of how many, so that I know how complete the picture is.
36. As a friend, I want the results to refresh when I reopen or reload the page, so that I see the latest answers.
37. As a friend, I want the confirmed dates shown at the top once the organizer sets them, so that the decision is impossible to miss.
38. As a friend, I want a closed poll to still show its results, so that I can look back at how we decided.

### Quality and constraints

39. As a friend, I want the page to work well on a small phone screen, including inside the KakaoTalk in-app browser, so that I can answer straight from the chat.
40. As a friend, I want the page to load fast on a mobile connection, so that I do not give up before answering.
41. As a friend, I want the date shown the same way everywhere, so that "12/24" cannot shift by a day because of a time zone.
42. As a Korean-speaking user, I want every label, message and button in Korean, so that nothing feels unfinished.
43. As a future maintainer, I want every user-facing string in translation files rather than in the screens, so that adding English later is a data change, not a rewrite.
44. As a privacy-minded friend, I want the site to collect nothing beyond the name I type and my answers, so that I am comfortable sharing it.
45. As the group, I want the poll link kept out of search engines, so that a private plan stays private.
46. As the organizer, I want the site to cost nothing to run for this group size, so that a hobby project does not become a bill.

## Implementation Decisions

**Architecture**

- The site is the single source of truth. KakaoTalk content is never read or imported. The PlayMCP connector is deliberately excluded from this project.
- One deployment on Cloudflare: static pages and a small server-side API, backed by a D1 database. The free tier is enough for about ten people.
- The frontend is a thin client over the API. All rules (validation, permissions, aggregation, ranking) live in the API so they can be tested at one seam.
- The frontend framework is left to implementation. The constraints are: small dependency footprint, good mobile performance, and a clean place for translation files. Choose the lightest option that satisfies them.
- Dates are plain calendar dates with no time zone. Displaying "which day" never depends on the viewer's device settings.

**Domain concepts (terms used in this spec; to be added to the glossary)**

- **Poll**: one question of the form "which days work for the trip", with a title, a start date, an end date, a status (open or closed), and an optional confirmed date range.
- **Respondent**: one named person's set of answers within a poll.
- **Availability**: the state a respondent assigns to one day: preferred (선호), available (가능), or unavailable (불가능). A day with no answer is simply absent, not a fourth stored state.
- **Organizer**: the person who creates and closes polls. Identified by possession of a secret key, not by an account.
- **Edit link**: a personal, unguessable link that restores edit access to one respondent's answers.

**Data model**

- Polls: unguessable public identifier, title, start date, end date, status, optional confirmed start and end dates, created time.
- Respondents: belong to a poll; display name; a normalized name used for uniqueness within the poll; a hash of the edit token (the token itself is never stored); created and updated times. Name uniqueness is per poll, case-insensitive, after trimming.
- Answers: belong to a respondent; one calendar date; one availability state. At most one answer per respondent per date. "No answer" means no row.

**Access model (no login)**

- The poll's public identifier is the access secret. Anyone with the link can read results and add themselves.
- Creating, closing, reopening a poll, setting the confirmed range, and removing a respondent require the organizer key, supplied as a deployment secret and sent with those requests.
- A respondent receives an edit token when first created. The API stores only its hash. Updating answers requires presenting the token.
- The browser remembers the edit token for the same device. Opening the personal edit link on another device or browser restores access. This is needed because the KakaoTalk in-app browser and the phone's default browser may not share stored data (this has not been verified; the edit link makes the design robust either way).
- Responses carry a "do not index" signal, and the site disallows crawling. This does not stop link previews in KakaoTalk, which is intended.

**API operations (behavioral contract, not URL design)**

- Create poll (organizer): input title, start date, end date. Output the poll with its public identifier. Rejects an end before the start, a period longer than 92 days, and an empty or overlong title.
- Get poll with results (public): returns poll details, the list of respondents with whether each has answered, and for every day in the range the counts and names per state plus the number of respondents with no answer, plus a ranked list of candidate days.
- Join poll (public): input display name. Output the new respondent and its edit token. Rejects an empty or overlong name, a name already taken in this poll, a closed poll, and a poll that reached the respondent cap (30).
- Save answers (respondent, with token): input the full set of date to state pairs. The set **replaces** the respondent's previous answers in one atomic step. Dates outside the poll's range or malformed are rejected and nothing is saved. Rejects a closed poll and a wrong or missing token.
- Close poll with optional confirmed range (organizer), reopen poll (organizer), remove respondent (organizer).
- Errors are returned as stable machine-readable codes, never as display text. The frontend maps codes to Korean (and later English) strings.

**Ranking rule for candidate days**

- Order days by fewest unavailable, then most preferred, then most available, then earliest date. A day is flagged as unanimous when at least one respondent has answered and every respondent who answered it chose preferred or available. Days nobody has answered are never ranked. The ranking is computed by the API so it is covered by tests.

**Internationalization**

- Every user-facing string, including calendar labels, state names, button text, error messages, and the page title and description used in link previews, lives in a translation file keyed by locale. Only Korean is provided now. The code never contains literal user-facing text. The locale is a single configuration value for now.

**Frontend behavior**

- Mobile first. The calendar is the main view; tapping a day cycles through preferred, available, unavailable, none. A range or weekend shortcut sets many days at once.
- States are shown with distinct shapes or icons in addition to color.
- The personal edit link is shown after the first save with a copy action.

## Testing Decisions

- **One seam: the HTTP API.** Tests send requests to the API and assert on responses and on observable state through further requests. They run against a real local D1 database (not a mock), started clean for each test, so schema, uniqueness constraints and atomic replacement are all exercised.
- A good test here checks external behavior only: given these requests, the API returns this status, this error code, these counts and this ranking. It does not inspect internal functions, table layout, or how hashing is done, beyond the observable fact that a wrong token fails and a right one works.
- Behaviors to cover: poll creation validation (range order, 92-day cap, title rules, organizer key required); joining (name rules, case-insensitive and whitespace-insensitive uniqueness, respondent cap, closed poll); saving answers (full replacement, out-of-range and malformed dates reject everything, wrong and missing token rejected, one respondent cannot alter another's answers); aggregation (per-day counts and names, unanswered counts, a day with no answers is not ranked, the ranking order and its tie-breaks, the unanimous flag); closing and reopening (writes rejected while closed, results still readable, confirmed range returned); removing a respondent (their answers disappear from results, the name becomes free again).
- The calendar screen is not covered by automated tests. Before the link is shared with the group, the organizer opens it on a real phone, inside KakaoTalk and in the default browser, and checks that tapping, saving, the edit link and the results view work.
- Prior art: none. The repository is empty, so these tests establish the pattern for later features.

## Out of Scope

- Reading KakaoTalk messages in any form, and the PlayMCP connector.
- Login, accounts, or any identity beyond the typed name and the edit token.
- Place survey, cost comparison, and any other trip-planning tab.
- Reminders, notifications, and sending messages through KakaoTalk.
- Automatic price collection of any kind.
- An English interface (only the structure to add it later is in scope).
- A custom domain; the default Cloudflare address is used.
- A list or dashboard of multiple polls. The API can hold more than one poll, but the interface targets one at a time.
- Real-time updates; results refresh on load or reload.
- Respondent self-deletion, and recovery beyond the organizer removing a respondent.

## Further Notes

- The shipping target is about three days from the start. If something has to give, drop the range and weekend shortcut (story 18) and the organizer reopen action (story 11) before dropping anything that affects trust in the numbers.
- The glossary file and the decisions folder do not exist yet. The terms above (Poll, Respondent, Availability, Organizer, Edit link) and the decision "the site is the source of truth; KakaoTalk is not read" should be recorded there when the domain-modeling step is run.
- The tracker's triage-labels document is referenced by the tracker conventions but is missing from the repository. The status string used here, `ready-for-agent`, follows the skill's instruction and should be checked against that document once it exists.
- Unverified assumption worth testing early: whether the KakaoTalk in-app browser keeps stored data between visits. The edit link makes the design safe either way, but the real behavior decides how often people need it.
