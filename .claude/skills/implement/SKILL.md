---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

If the project has a typecheck, run it regularly. Run single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "code-review" to review the work.

Do not commit unless the user asks. Leave the changes in the working tree and summarize the diff.

<!-- Local changes (2026-11-03, upstream mattpocock/skills 4ae2317): typecheck is conditional; the automatic "commit to the current branch" step was removed. -->

