# The site is the source of truth; KakaoTalk is not read

Friends answer on the site itself, and only what they enter there counts. KakaoTalk is used only to hand the poll link around. The site never reads, imports or interprets chat messages, and the PlayMCP connector is deliberately excluded.

The problem this project solves is that dates buried in free-text chat replies ("I can do the 12th", "not that weekend") cannot be counted. Parsing the same free text would bring that ambiguity back. Reading chats would also mean collecting more than a name and answers, which breaks the promise that the site stores nothing else. A structured form that every friend fills in is the only input whose meaning is exact.

## Considered Options

- **Read the KakaoTalk group chat through the PlayMCP connector and infer availability.** Rejected: inference from free text is unreliable, and silence in chat would be indistinguishable from "no answer" or "unavailable".
- **Site as the only source, chat only carries the link (chosen).** The cost is that a friend must open the link and tap their answers instead of just replying in chat.

## Consequences

- Link previews in KakaoTalk are intended and kept (`og:` tags are served), while search engines are told not to index the site.
- Anything that wants chat content as input (reminders, auto-filled answers) would reverse this decision and should supersede this ADR rather than be added quietly.
