# 04: See per-day results and best days

**What to build:** Anyone with the poll link can see how the group is leaning. For every day they see how many people are preferred, available, unavailable and have not answered. Tapping a day shows the names behind each state. The page ranks the best candidate days and highlights days that everyone who answered can do. The ranking is computed by the API so it is covered by tests.

**Blocked by:** 03 (Mark days and save answers)

**Status:** ready-for-agent

- [x] The poll's results return, for every day in the period, the count and the names for each state plus the number of respondents with no answer for that day
- [x] The results return how many respondents have answered at least one day out of how many have joined, and the page shows this as "M of N answered"
- [x] Candidate days are ordered by fewest unavailable, then most preferred, then most available, then earliest date; each tie-break is covered by a test
- [x] A day nobody has answered is never ranked
- [x] A day is flagged unanimous when at least one respondent answered it and every respondent who answered it chose preferred or available; the page makes unanimous days stand out
- [x] Tapping a day on the results view shows the names for preferred, available and unavailable
- [x] Results reflect the latest saved answers when the page is reopened or reloaded; no live updating is required
- [x] Results are readable by anyone with the link, with no token
- [x] All new user-facing text lives in the Korean translation file
- [x] API tests cover counts, names, unanswered counts, the ranking order and its tie-breaks, the unanimous flag and the unranked-day rule at the HTTP API seam against the real local D1 database
