# workflow-matt-skill

A practice project for working the way a professional team does: grill, spec, tickets,
implement, review. The point is to learn the workflow and to check the skills before
promoting them to `~/.claude/skills/`.

## Scope

This is a work-style project. The global "portfolio order" (the user decides structure and
names) does not apply here. Claude may lead implementation through `to-spec`, `to-tickets`,
`implement` and `implement-spec`.

## Installed here (project scope)

Copies of mattpocock/skills at commit 4ae2317 (2026-10-31), without the `agents/` Codex
metadata. 23 skills: grilling, grill-me, grill-with-docs, domain-modeling, to-spec,
to-tickets, implement, implement-spec, code-review, pr, setup-matt-pocock-skills,
prototype, research, retro, ask-matt, handoff, writing-for-agents, diagnosing-bugs, tdd,
codebase-design, improve-codebase-architecture, to-questionnaire, wait-what.

Local changes (each marked with an HTML comment in the file):

- `grilling`: a round asks at most 3 questions.
- `implement`: the typecheck step is conditional; the automatic commit step is removed.
  `implement-spec` still commits and merges on its integration branch.

## Git guardrail

`.claude/hooks/block-dangerous-git.sh` blocks force push, `reset --hard`, `clean -f`,
`branch -D`, `checkout .` and `restore .`. Plain `git push` is allowed. It needs `jq`.

## Before the first spec

Run `/setup-matt-pocock-skills` once. `to-spec`, `to-tickets`, `implement-spec` and
`code-review` ask for the issue tracker it configures.

## Agent skills

### Issue tracker

Issues and specs are local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
