# 06: Organizer controls: close, confirm dates, remove respondent

**What to build:** Once the group has agreed, the organizer can close the poll and mark the confirmed date range, which everyone then sees at the top of the page. Closing stops further changes but results stay readable. The organizer can reopen a poll closed by mistake and can remove a respondent (for example someone who mistyped their name or lost their edit link) so that person can start over. All of these actions require the organizer key.

**Blocked by:** 04 (See per-day results and best days)

**Status:** ready-for-agent

- [x] Closing a poll requires the organizer key and may include a confirmed start and end date; a missing or wrong key is rejected
- [x] The confirmed range must lie inside the poll's period and its end must not be before its start; invalid ranges are rejected with stable error codes
- [x] While a poll is closed, joining and saving answers are rejected, and results remain readable by anyone with the link
- [x] A closed poll with a confirmed range shows the range prominently at the top of the poll page and the results page
- [x] Reopening a poll requires the organizer key and makes joining and saving work again; the confirmed range is cleared or kept as stated in the ticket's tests, and the choice is documented
- [x] Removing a respondent requires the organizer key; their answers disappear from every count, name list and ranking, the "M of N answered" figure updates, and their name becomes free to use again
- [x] A removed respondent's personal edit link and token no longer work (this completes the behavior noted in ticket 05)
- [x] The organizer actions are reachable from the poll page only when the organizer key is supplied; the page does not show organizer controls to ordinary visitors
- [x] All new user-facing text lives in the Korean translation file
- [x] API tests cover close, confirm range validation, writes rejected while closed, results still readable, reopen, remove respondent (including the effects on results and the name becoming free) and the key requirement on every organizer action, at the HTTP API seam against the real local D1 database

## Notes (implementation)

- Endpoints, all requiring the organizer key (`Authorization: Bearer`, checked before anything else, so a wrong key gets 401 even for a poll that does not exist): `POST /api/polls/:id/close` (optional `confirmedStartDate` + `confirmedEndDate`, both or neither), `POST /api/polls/:id/reopen`, `DELETE /api/polls/:id/respondents/:respondentId` (204).
- New error codes: `CONFIRMED_OUT_OF_RANGE`, `RESPONDENT_NOT_FOUND`. A confirmed range reuses `END_BEFORE_START` and `INVALID_DATE`; giving only one of the two dates is `INVALID_REQUEST`.
- Closing an already closed poll is allowed and replaces the confirmed range.
- **Reopening clears the confirmed range** (decision for criterion 5): a reopened poll is "not decided yet", and an old confirmed range at the top of an open poll would mislead.
- Removing a respondent deletes their row. Their answers go through `ON DELETE CASCADE`, and the token hash lives in the same row, so their edit link stops working (tested). A removed person's browser still holds the old token: the page clears it on the first 401 and shows the join form with an explanation.
- The results response now lists respondents as `{ id, name, answered }`. The id alone cannot read or change anything (the edit token is separate, deletion needs the organizer key).
- "Organizer controls are reachable only when the key is supplied": the controls appear only on `/p/<id>#organizer`, and the key is typed into a password field and kept in memory only (never in the URL or storage). Real protection is the server checking the key on every organizer request; the hash only keeps the buttons away from ordinary visitors.
- Not verified in a browser: saving answers from a page that was left open while the organizer removed the respondent (the 401 handling on save is the same code path as on load, but was not exercised). The organizer panel's respondent list does not refresh when someone joins while the panel is open; it refreshes after any organizer action or a reload.
