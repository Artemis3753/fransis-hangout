# 05: Restore edit access with a personal edit link

**What to build:** After a respondent first saves, the page shows their personal edit link with a one-tap copy button. Opening that link on any device or browser restores their ability to edit their own answers. This exists because the KakaoTalk in-app browser and the phone's default browser may not share stored data (not yet verified), so a friend who answered inside KakaoTalk could otherwise be locked out of their own answers. Opening the poll in a browser that does not know the visitor explains why editing is unavailable and what to do.

**Blocked by:** 03 (Mark days and save answers)

**Status:** ready-for-agent

- [x] After the first successful save, the page shows the personal edit link and a copy button; the link is unguessable and works only for that one respondent
- [x] Opening the personal edit link on a device with no stored data loads that respondent's saved answers and allows editing and saving
- [x] The link restores access without exposing anyone else's edit capability; using it never reveals another respondent's token
- [x] An invalid or tampered edit link shows a clear error and does not grant edit access
- [x] A visitor whose browser does not recognize them sees the results and a Korean message explaining that they can join as a new respondent or use their personal edit link
- [x] Removing a respondent later (ticket 06) invalidates that respondent's edit link; the behavior is documented here and tested in ticket 06
- [x] All new user-facing text lives in the Korean translation file
- [x] API tests cover restoring access with a valid link, rejecting an invalid link, and that one respondent's link cannot edit another respondent's answers, at the HTTP API seam against the real local D1 database

## Notes (implementation)

- The link is `/p/<pollId>#edit=<respondentId>.<editToken>`. It reuses the token issued at join time; no new secret exists. The part after `#` is never sent to the server or in the Referer header, and the page removes it from the address bar after handling it.
- `GET /api/polls/:id/respondents/:respondentId` (token required) returns only `{ respondent: { id, name } }` so the page can greet the person. Unknown poll, unknown respondent, wrong token and another respondent's token all get the same `401 EDIT_TOKEN_INVALID`.
- A wrong or truncated link changes nothing: it does not overwrite a respondent already remembered on that browser.
- Removing a respondent (ticket 06) deletes their row, which holds the token hash, so their edit link stops working (401). Ticket 06 must add the test for this.
- Not verified: the copy button's fallback message (clipboard blocked) was not triggered in a browser; the real-phone and KakaoTalk checks belong to ticket 08.
