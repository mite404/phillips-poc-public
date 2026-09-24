# Persona picker

The auth portal lets a user choose Education Supervisor or Student before entering the app.

## Sub-features

- `portal-render` shows Phillips branding and both persona buttons
- `supervisor-enter` navigates to the supervisor dashboard
- `student-enter` navigates to the student dashboard

## How to get to it (user POV)

- Open `http://127.0.0.1:5173/` with no prior session

## Driving it with cursor-ide-browser

Preconditions:

- `control-phillips-poc.sh doctor` reports OK

- **Render portal.** `browser_navigate` to `http://127.0.0.1:5173/`. Snapshot contains `Phillips`, `Education Supervisor`, and `Student`.
- **Enter student.** Click `Student`. Snapshot contains `Assigned Programs` and `Completed Programs`.
- **Return to portal.** Click `Back to Auth Portal`. Snapshot contains both persona buttons again.
- **Enter supervisor.** Click `Education Supervisor`. Snapshot contains supervisor dashboard content (metrics cards).
- **Proof.** Save snapshot to `/tmp/phillips-poc-verify-$VERIFY_RUN_ID/persona-picker.aria.txt`.

## Gotchas

- Student and supervisor share the same origin; use footer `Back to Auth Portal` to reset persona
- Dark mode preference persists in localStorage and does not block persona selection
