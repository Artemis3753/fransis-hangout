# Fransis Hangout

A login-free site for one friend group's KakaoTalk chat, used to settle shared plans. The first plan it settles is which days work for a group trip.

## Language

### The poll

**Poll**:
One question of the form "which days work for the trip", covering a period of calendar days, with a title and a status (open or closed).
_Avoid_: Survey, vote, event

**Candidate day**:
One calendar day inside a poll's period that respondents can mark.
_Avoid_: Slot, option

**Closed poll**:
A poll that no longer accepts new respondents or changed answers, but whose results stay readable. The organizer can reopen it.
_Avoid_: Finished, archived, locked

**Confirmed range**:
The final date range the organizer records when closing a poll, shown at the top of the page as the group's decision.
_Avoid_: Final date, winner, result

### The people

**Respondent**:
One named person's set of answers within a poll. Identified inside the poll by a name that is unique ignoring case and surrounding spaces.
_Avoid_: Voter, participant, attendee, user

**Organizer**:
The person who creates, closes and reopens polls and removes respondents. Identified by possession of a secret key, not by an account.
_Avoid_: Admin, owner, host

**Edit link**:
A personal, unguessable link that restores edit access to one respondent's answers on any device. Whoever holds it can change that respondent's answers.
_Avoid_: Magic link, login link, token

### The answers

**Availability**:
The state a respondent assigns to one candidate day: preferred (선호), available (가능) or unavailable (불가능).
_Avoid_: Vote, RSVP, status

**No answer**:
A candidate day the respondent has not marked. It is the absence of an answer, never a fourth availability, and never counts as unavailable.
_Avoid_: Unknown, blank, pending

### The results

**Ranking**:
The ordered list of candidate days that at least one respondent answered, best first: fewest unavailable, then most preferred, then most available, then earliest date.
_Avoid_: Leaderboard, score, best days

**Unanimous day**:
A candidate day that at least one respondent answered and that every respondent who answered it marked preferred or available.
_Avoid_: Perfect day, consensus
