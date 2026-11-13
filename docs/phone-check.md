# Real-phone check (ticket 08)

**Status: NOT DONE.** Nothing below has been tried on a real phone yet. Fill in the Results section after the check; until then no sentence in this file claims a result.

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

- Phone model and OS version:
- KakaoTalk version:
- Default browser used:
- A. Preview card shown? (title / description / bare URL only):
- B. Join, tap, save in the in-app browser:
- B2. Copy button / long-press fallback:
- B3. Results view:
- C. In-app browser kept stored data after closing and reopening? (yes / no):
- D. Default browser: name form shown? Edit link restored access?
- E. Layout problems:
- Defects found (fix here or open a new ticket under `.scratch/date-poll/issues/`):
