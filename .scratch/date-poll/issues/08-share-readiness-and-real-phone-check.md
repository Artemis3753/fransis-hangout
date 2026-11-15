# 08: Share readiness: link preview, copy link, real-phone check

**What to build:** Everything needed before the link goes into the KakaoTalk group chat. The poll link shows a clear title and description when pasted into KakaoTalk, a copy-link button gives the organizer the link in one tap, and the whole flow is verified by hand on a real phone, inside KakaoTalk's in-app browser and in the phone's default browser. The result of that hand check is written down, including the previously unverified question of whether stored data survives between visits in KakaoTalk's in-app browser.

**Blocked by:** 05 (Restore edit access with a personal edit link)

**Status:** ready-for-agent

- [x] Link preview information (title and description, from the Korean translation file) is present on the poll page so KakaoTalk shows a recognizable preview when the link is pasted
- [x] The poll page has a copy-link button that puts the poll link on the clipboard and confirms it in Korean
- [x] On a real phone, inside KakaoTalk's in-app browser: opening the link, joining, tapping days, saving, seeing the personal edit link and viewing the results all work (reported fine by the organizer, including the edit-link copy, step B2)
- [x] On the same phone's default browser: the same flow works, and the personal edit link restores edit access when the stored data is absent (step D, reported fine by the organizer)
- [ ] The hand check records, in a short note in the repository written in English, what was tried, on which phone and OS, and whether KakaoTalk's in-app browser kept the respondent's stored data after closing and reopening the link. **Partly met (unchecked on purpose, 2026-11-15 review):** the note is in `docs/phone-check.md` and records what was tried, but phone model, OS and KakaoTalk version were not recorded, and the storage answer is only the organizer's "fine" report, so the open question in spec line 159 is not really answered. The edit link (step D) makes the design safe either way. Fill in the three "not recorded" fields if the phone can still be checked, or accept the gap and say so.
- [x] Any defect found during the hand check is either fixed in this ticket or recorded as a new ticket under the same feature (none reported)
- [x] The poll link is confirmed not to appear in search engine results and the site's crawling rules are still in place (production re-checked 2026-11-13: `x-robots-tag: noindex, nofollow` on `/` and `/p/<id>`, `robots.txt` is `Disallow: /`)
- [x] All new user-facing text lives in the Korean translation file

## Notes (implementation)

- The scraper behind KakaoTalk previews reads the HTML the server sends and does not run scripts, so the Worker now injects the poll title, description (from `web/i18n/ko.ts`) and `og:` tags into `/p/<id>` itself (`wrangler.jsonc` sends `/p/*` through the Worker first). Poll titles are HTML-escaped. Tested at the API seam in `test/share-page.test.ts`.
- Criterion 1 is checked for "the information is present in the served HTML". Whether KakaoTalk actually shows a card was checked in step A of `docs/phone-check.md` (see the phone-check note below). There is no `og:image`; the card is text only.
- `robots.txt` still says `Disallow: /`. Kakao has no official statement on whether its scraper obeys it; in practice the card appeared anyway (see below), so no change is needed.
- Phone check on 2026-11-13: the KakaoTalk preview card appeared (title, description, domain; no image) even though `robots.txt` says `Disallow: /`, so the scraper did not obey it for this poll and `kakaotalk-scrap` stays disallowed. All steps, including D, were reported fine; details are in `docs/phone-check.md`.
- Production re-check after the deploy (2026-11-13): og tags are in the served HTML of a real poll page, `x-robots-tag: noindex, nofollow` is still sent, `robots.txt` is unchanged.
