# AGENTS.md

## Working in this repo

- **The maintainer commits.** Leave changes unstaged and finish with a
  ready-to-paste conventional commit message (`feat:`, `fix:`, `refactor:`,
  `perf:`, `chore:`, lowercase subject) that describes what a DM or player
  notices, not the code change. Changelogs are generated from history, so every
  bug fix is its own `fix:` commit, kept apart from refactors and dependency
  bumps.
- **Steps.** Split multi-file work into reviewable steps (a DB change, one route
  and its composable, one set of components). Finish each step with a short
  report and its commit message, then wait before starting the next.
- **Tests travel with the change.** Every new or changed behaviour gets its
  tests in the same step.
- **Narrow verification.** The maintainer runs the full lint and test suites
  themselves. Run only the specs for the code you changed, then
  `npm run typecheck` (raw `vue-tsc` checks nothing here), then
  `npx prettier --write` on every changed and new file as the last command:
  `(git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard) | sort -u | xargs npx prettier --write --ignore-unknown`.
  Leave `.snap` files to the maintainer, who regenerates them with `-u`.
- **Dev server.** The maintainer keeps `npm run dev` running on port 3000, and
  `nuxt prepare` breaks it. Check `lsof -iTCP:3000 -sTCP:LISTEN` before running
  `nuxt prepare` or `nuxt typecheck`.
- **Database changes** are SQL the maintainer runs by hand in production (see
  ADR-0003). Put the full SQL in the step report.

## Code conventions

Read `docs/agents/conventions.md` before writing or reviewing app, server or
shared code: where utils, types and components go, and the house rules for
forms, icons, toasts, i18n and queries.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on `JeremyMees/dnd-tracker`, via the `gh`
CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, used as-is: `needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
