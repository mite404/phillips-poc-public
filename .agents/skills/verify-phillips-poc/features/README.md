# Phillips POC verification map

Read this index before driving the app. Each feature file is a recipe for one user-facing area.

## Baseline preconditions

- Launch with `.agents/skills/verify-phillips-poc/scripts/control-phillips-poc.sh launch`
- Set `VERIFY_RUN_ID` to a unique id per run so state dirs do not collide
- Run `doctor` and require Vite + json-server health
- Never drive ports 5173/3001 unless this run started them

## Driving conventions

- Start from the auth portal unless a feature says otherwise
- Prefer button text and heading text over CSS selectors
- Capture snapshot text for every assertion, not just screenshots
- Report unreachable paths with the blocking precondition

## Proof and skip reporting

- UI proof includes an ARIA snapshot showing the asserted strings
- Data-backed UI claims also curl json-server for the fixture record
- Keep proof artifacts after `stop`

## Features

- [Persona picker](./persona-picker.md) — auth portal and role selection
- [Student dashboard](./student-dashboard.md) — assigned/completed program lists
- [Supervisor dashboard](./supervisor-dashboard.md) — supervisor landing metrics
