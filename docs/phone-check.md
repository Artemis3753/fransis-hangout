# Real-phone check (ticket 08)

**Status: DONE with gaps (2026-11-13; gaps noted in the 2026-11-15 review).** The storage question (step C) is not really answered: only an "all fine" report exists, with no description of what was seen, and the phone details below are blank. The organizer reported every step (A, B, B2, B3, C, D, E) fine on a real phone. Only the card in step A was seen in a screenshot; the other steps are the organizer's own report, with no detail recorded. Phone model, OS and KakaoTalk version were not recorded.

The calendar screen has no automated tests, so this hand check is the only proof that tapping, saving, the edit link and the results view work on a phone and inside KakaoTalk. It also answers one open question: **does KakaoTalk's in-app browser keep a respondent's stored data after the link is closed and reopened?** (The edit link makes the design safe either way, but the answer decides how often people will need it.)

## Setup

Use a throwaway poll so no real poll is polluted. In your own terminal (the key is read without echo and never pasted anywhere):

```sh
read -s "KEY?Organizer key: "
curl -s -X POST https://fransis-hangout.yd30421.workers.dev/api/polls \
  -H "authorization: Bearer $KEY" -H "content-type: application/json" \
  -d '{"title":"Phone test","startDate":"2026-12-01","endDate":"2027-01-31"}'
```

The response holds the poll `id`; the link is `https://fransis-hangout.yd30421.workers.dev/p/<id>`. Send it to yourself in KakaoTalk's "chat with me".

## Steps (what each step proves)

| # | Do this | What it proves |
|---|---------|----------------|
| A | Paste the link into the KakaoTalk chat and wait a few seconds. Does a preview card with the title "Phone test" and the Korean description appear, or only the bare URL? | Whether KakaoTalk's scraper can read the server-rendered tags. If only the bare URL shows, `robots.txt` (`Disallow: /`) may be blocking the scraper (unverified; Kakao does not document it). Report it and `kakaotalk-scrap` can be allowed in `robots.txt`. |
| B | Tap the link (opens in KakaoTalk's in-app browser). Join with a name, tap several days through all states, save. | The core flow works in the in-app browser. |
| B2 | After saving, find "내 수정 링크". Tap the copy button. If it says it could not copy, long-press the link in the box instead. Copy it to the chat. | Whether the clipboard works in the in-app browser, and that the fallback is usable. |
| B3 | Scroll to the results. Is "1명 중 1명 응답" shown, and does tapping a day show your name? | The results view works on a phone. |
| C | Close the in-app browser, then tap the link in the chat again. Do you see "…님, 참여했어요." with your answers, or the name form? | **The storage question**: whether the in-app browser kept your data. |
| D | Open the same link in the phone's default browser (in-app browser menu, "open in another browser"; or paste it into Safari/Chrome). You should see the name form. Now open the **edit link** you copied in B2 there. | The default browser has separate storage, and the edit link restores edit access there. Then change a day and save. |
| E | On every screen: is there horizontal scrolling? Can you tap the day cells without mis-taps? | Layout on a real screen (checked only in a desktop browser at 360px so far). |

## Results (fill in)

- Phone model and OS version: not recorded
- KakaoTalk version: not recorded
- Default browser used: not recorded
- A. Preview card shown? **Card shown.** Title "Phone test", the Korean description (cut off with "…" after the first line and a half), and the bare domain as the link; no image (none is set). Seen in a screenshot of the "chat with me" on 2026-11-13. `robots.txt` still says `Disallow: /` on production, so at least for this poll KakaoTalk's scraper did not obey it and `kakaotalk-scrap` does not need to be allowed. (One poll, one phone; not a guarantee for every KakaoTalk version.)
- B. Join, tap, save in the in-app browser: fine, as reported by the organizer.
- B2. Copy button / long-press fallback: fine, as reported by the organizer (which of the two was used was not recorded).
- B3. Results view: fine, as reported by the organizer.
- C. In-app browser kept stored data after closing and reopening? **Reported fine** (the organizer's "all fine" answer to this question; the exact screen was not described).
- D. Default browser: name form shown? Edit link restored access? Fine, as reported by the organizer.
- E. Layout problems: none reported.
- Defects found (fix here or open a new ticket under `.scratch/date-poll/issues/`): none reported.
