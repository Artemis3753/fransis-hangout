# 05: Restore edit access with a personal edit link

**What to build:** After a respondent first saves, the page shows their personal edit link with a one-tap copy button. Opening that link on any device or browser restores their ability to edit their own answers. This exists because the KakaoTalk in-app browser and the phone's default browser may not share stored data (not yet verified), so a friend who answered inside KakaoTalk could otherwise be locked out of their own answers. Opening the poll in a browser that does not know the visitor explains why editing is unavailable and what to do.

**Blocked by:** 03 (Mark days and save answers)

**Status:** ready-for-agent

- [ ] After the first successful save, the page shows the personal edit link and a copy button; the link is unguessable and works only for that one respondent
- [ ] Opening the personal edit link on a device with no stored data loads that respondent's saved answers and allows editing and saving
- [ ] The link restores access without exposing anyone else's edit capability; using it never reveals another respondent's token
- [ ] An invalid or tampered edit link shows a clear error and does not grant edit access
- [ ] A visitor whose browser does not recognize them sees the results and a Korean message explaining that they can join as a new respondent or use their personal edit link
- [ ] Removing a respondent later (ticket 06) invalidates that respondent's edit link; the behavior is documented here and tested in ticket 06
- [ ] All new user-facing text lives in the Korean translation file
- [ ] API tests cover restoring access with a valid link, rejecting an invalid link, and that one respondent's link cannot edit another respondent's answers, at the HTTP API seam against the real local D1 database
