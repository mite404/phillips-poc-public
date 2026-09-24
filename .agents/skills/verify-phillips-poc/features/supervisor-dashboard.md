# Supervisor dashboard

The supervisor dashboard is the landing view after choosing Education Supervisor.

## Sub-features

- `dashboard-render` shows supervisor metrics and navigation affordances

## How to get to it (user POV)

- Open `http://127.0.0.1:5173/` and click `Education Supervisor`

## Driving it with cursor-ide-browser

Preconditions:

- `control-phillips-poc.sh doctor` reports OK

- **Load dashboard.** Click `Education Supervisor`. Snapshot shows supervisor dashboard content
  (stat cards and sidebar navigation).
- **Proof.** Save snapshot to `/tmp/phillips-poc-verify-$VERIFY_RUN_ID/supervisor-dashboard.aria.txt`.

## Gotchas

- Supervisor sidebar exposes program builder and student progress routes; those are separate features
  not yet mapped here
