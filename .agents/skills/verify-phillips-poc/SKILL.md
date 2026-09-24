---
name: verify-phillips-poc
description: Drive the Phillips Education POC web app (Vite + json-server) for end-to-end verification. Use after UI or data-flow changes to student/supervisor dashboards, program builder, or enrollment flows.
---

# verify-phillips-poc

Phillips Education POC is a React + Vite web UI backed by json-server on port 3001.
The primary verification surface is the browser persona picker and role-specific dashboards.

## Launch

```bash
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh launch
```

Starts `bun dev` (Vite on `5173`, json-server on `3001`). Ready when both URLs respond.

Teardown:

```bash
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh stop
```

Do not run a second instance. Ports 5173 and 3001 are shared with normal `bun dev`.

## Doctor

```bash
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh doctor
```

Confirms the recorded pid is alive, Vite serves the SPA shell (`id="root"`), and json-server returns
enrollments with `learnerId`. Run this before spending a session on browser driving when anything
looks off.

## Gate

Run these before launching an instance. They prove compile-time and unit coverage; they do not
prove UI behavior.

**Local (not wired into a pre-commit hook in this repo)**

```bash
bunx tsc --noEmit
bun run lint
bunx vitest run
bun run build
```

**CI (`.github/workflows/lint-and-build.yaml`)**

```bash
bun run lint
bun run build
```

Vitest is not in CI. Typecheck runs inside `bun run build` via `tsc -b`.

No formatter tier is configured. ESLint flat config only.

## Drive

Harness: `cursor-ide-browser` in Cursor, `mcp__chrome-devtools__*` in Claude Code.

Base URL: `http://127.0.0.1:5173/`

Persona entry points on the auth portal:

- `Education Supervisor` button → supervisor dashboard (`currentView=dashboard`)
- `Student` button → student dashboard (`currentView=programs`)

Stable handles:

- Auth portal heading text: `Phillips`
- Student dashboard headings: `Assigned Programs`, `Completed Programs`
- Footer: `Back to Auth Portal`

Example student-dashboard proof (cursor-ide-browser):

1. `browser_navigate` → `http://127.0.0.1:5173/`
2. `browser_snapshot` → confirm `Student` button
3. `browser_click` → `Student`
4. `browser_snapshot` → confirm `Completed Programs` section contains
   `Advanced 5-Axis Certification`
5. Assert `Q1 Safety Fundamentals` is absent from the snapshot text

Use the feature map (`.agents/skills/verify-phillips-poc/features/`) for the full coverage set.
The map, not whichever screen is open, defines what to exercise.

## Evidence

Store proof under `/tmp/phillips-poc-verify-$VERIFY_RUN_ID/` (or a path named in the task).

Each proof needs:

- The user action (click Student, expand accordion, etc.)
- The resulting UI state (ARIA snapshot or screenshot)
- For data-backed claims, a side-effect check (curl enrollments, grep page text)

Production boundaries: legacy Phillips API and json-server are real HTTP in dev. Do not mock
`localApi` or `legacyApi` for dashboard proofs unless the task is explicitly API-unit scoped.

Assert on content, not exit code alone. A grep that finds zero matches must fail the run.

## Cleanup

```bash
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh stop
```

Kills only the pid recorded at launch. Evidence files live outside the state dir and survive stop.

## Helpers

```bash
chmod +x .agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh launch
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh doctor
.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh stop
```

Feature recipes: `.agents/skills/verify-phillips-poc/features/README.md`

Completion proof against json-server fixture:

```bash
bun .agents/skills/verify-phillips-poc/scripts/verify-student-completion.mjs
```

Must print `PASS` with `Advanced 5-Axis Certification` in `completed`.
