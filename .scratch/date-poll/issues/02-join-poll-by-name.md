# 02: Join a poll by name

**What to build:** A friend opens the poll link, types just a name, and becomes a respondent of the poll. They receive an edit token that proves later that the answers are theirs. A name already taken in this poll, a closed or full poll, and bad names are refused with clear Korean messages. No login or account is involved.

**Blocked by:** 01 (Create a poll and open it by link)

**Status:** ready-for-agent

- [x] Joining with a valid name creates a respondent in that poll and returns an edit token; only a hash of the token is stored
- [x] An empty or overlong name is rejected with a stable error code
- [x] A name already used in the same poll is rejected, comparing case-insensitively and ignoring surrounding spaces (for example "Minji" and " minji " collide); the same name in a different poll is allowed
- [x] A poll that already has 30 respondents rejects further joins
- [x] Joining a closed poll is rejected (the ability to close arrives in a later ticket, so this is covered by creating the closed state directly in the test)
- [x] Joining an unknown poll is rejected
- [x] The join screen explains in Korean why a join failed, using the error code mapping from ticket 01
- [x] After joining, the device remembers the respondent so reopening the page on the same device does not ask for the name again
- [x] All new user-facing text lives in the Korean translation file
- [x] API tests cover every rule above at the HTTP API seam against the real local D1 database
