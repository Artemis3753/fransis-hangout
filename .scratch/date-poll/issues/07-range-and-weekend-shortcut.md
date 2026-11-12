# 07: Range and weekend shortcut

**What to build:** A respondent can set many days at once instead of tapping each day: for example mark a whole weekend, or a range from one day to another, with a chosen state. This is a convenience on top of the calendar and changes no data rules. It is the first ticket to drop if the schedule is tight.

**Blocked by:** 03 (Mark days and save answers)

**Status:** ready-for-agent

- [ ] A respondent can pick a state and apply it to every weekend day (Saturday and Sunday) in the poll's period in one action
- [ ] A respondent can pick a state and apply it to a range by choosing a first and a last day; both ends are included
- [ ] The shortcut only changes the on-screen selection; the answers are still stored only when the respondent saves, using the same save behavior as ticket 03
- [ ] The shortcut never touches days outside the poll's period
- [ ] The shortcut can be undone by tapping individual days or by reloading before saving
- [ ] The controls are usable on a small phone screen
- [ ] All new user-facing text lives in the Korean translation file
- [ ] No API change is needed; the existing API tests still pass
