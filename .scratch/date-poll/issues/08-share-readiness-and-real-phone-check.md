# 08: Share readiness: link preview, copy link, real-phone check

**What to build:** Everything needed before the link goes into the KakaoTalk group chat. The poll link shows a clear title and description when pasted into KakaoTalk, a copy-link button gives the organizer the link in one tap, and the whole flow is verified by hand on a real phone, inside KakaoTalk's in-app browser and in the phone's default browser. The result of that hand check is written down, including the previously unverified question of whether stored data survives between visits in KakaoTalk's in-app browser.

**Blocked by:** 05 (Restore edit access with a personal edit link)

**Status:** ready-for-agent

- [ ] Link preview information (title and description, from the Korean translation file) is present on the poll page so KakaoTalk shows a recognizable preview when the link is pasted
- [ ] The poll page has a copy-link button that puts the poll link on the clipboard and confirms it in Korean
- [ ] On a real phone, inside KakaoTalk's in-app browser: opening the link, joining, tapping days, saving, seeing the personal edit link and viewing the results all work
- [ ] On the same phone's default browser: the same flow works, and the personal edit link restores edit access when the stored data is absent
- [ ] The hand check records, in a short note in the repository written in English, what was tried, on which phone and OS, and whether KakaoTalk's in-app browser kept the respondent's stored data after closing and reopening the link
- [ ] Any defect found during the hand check is either fixed in this ticket or recorded as a new ticket under the same feature
- [ ] The poll link is confirmed not to appear in search engine results and the site's crawling rules are still in place
- [ ] All new user-facing text lives in the Korean translation file
