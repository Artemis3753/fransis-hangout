# 06: Organizer controls: close, confirm dates, remove respondent

**What to build:** Once the group has agreed, the organizer can close the poll and mark the confirmed date range, which everyone then sees at the top of the page. Closing stops further changes but results stay readable. The organizer can reopen a poll closed by mistake and can remove a respondent (for example someone who mistyped their name or lost their edit link) so that person can start over. All of these actions require the organizer key.

**Blocked by:** 04 (See per-day results and best days)

**Status:** ready-for-agent

- [ ] Closing a poll requires the organizer key and may include a confirmed start and end date; a missing or wrong key is rejected
- [ ] The confirmed range must lie inside the poll's period and its end must not be before its start; invalid ranges are rejected with stable error codes
- [ ] While a poll is closed, joining and saving answers are rejected, and results remain readable by anyone with the link
- [ ] A closed poll with a confirmed range shows the range prominently at the top of the poll page and the results page
- [ ] Reopening a poll requires the organizer key and makes joining and saving work again; the confirmed range is cleared or kept as stated in the ticket's tests, and the choice is documented
- [ ] Removing a respondent requires the organizer key; their answers disappear from every count, name list and ranking, the "M of N answered" figure updates, and their name becomes free to use again
- [ ] A removed respondent's personal edit link and token no longer work (this completes the behavior noted in ticket 05)
- [ ] The organizer actions are reachable from the poll page only when the organizer key is supplied; the page does not show organizer controls to ordinary visitors
- [ ] All new user-facing text lives in the Korean translation file
- [ ] API tests cover close, confirm range validation, writes rejected while closed, results still readable, reopen, remove respondent (including the effects on results and the name becoming free) and the key requirement on every organizer action, at the HTTP API seam against the real local D1 database
