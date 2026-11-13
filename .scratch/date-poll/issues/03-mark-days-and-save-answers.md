# 03: Mark days and save answers

**What to build:** A respondent sees the day-by-day calendar for the poll's period and taps a day to cycle through preferred (선호), available (가능), unavailable (불가능) and no answer. One save action stores all of their answers, replacing whatever they saved before. Only the holder of their edit token can change their answers. Coming back on the same device shows their previous answers.

**Blocked by:** 02 (Join a poll by name)

**Status:** ready-for-agent

- [x] The calendar covers exactly the poll's period, one cell per day, and works on a small phone screen without horizontal scrolling
- [x] Tapping a day cycles preferred, available, unavailable, no answer, and back; days left untouched stay "no answer" and are never treated as unavailable
- [x] Each state is distinguishable by shape or icon in addition to color
- [x] Saving sends the full set of date and state pairs; the saved set replaces the respondent's previous answers in one atomic step (days that were answered before and are now "no answer" disappear)
- [x] If any submitted date is malformed or outside the poll's period, the whole save is rejected and nothing changes
- [x] Saving with a missing or wrong edit token is rejected; one respondent cannot change another respondent's answers even in the same poll
- [x] Saving to a closed poll is rejected (covered by creating the closed state directly in the test)
- [x] After a successful save the page shows a clear confirmation; after a failed save it shows a Korean message that says what went wrong
- [x] Reopening the poll on the same device shows the respondent's saved answers pre-marked
- [x] All new user-facing text lives in the Korean translation file
- [x] API tests cover every rule above at the HTTP API seam against the real local D1 database
