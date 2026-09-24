# Student dashboard

The student dashboard shows assigned and completed programs for the mock learner Bob Martinez.

## Sub-features

- `assigned-list` shows in-progress programs
- `completed-list` shows programs whose enrollments are all Completed
- `completion-derived` completed list matches json-server enrollment status, not hardcoded fixtures

## How to get to it (user POV)

- Open `http://127.0.0.1:5173/` and click `Student`

## Driving it with cursor-ide-browser

Preconditions:

- `control-phillips-poc.sh doctor` reports OK
- Mock learner `6c541134-c0f6-41af-904a-1dcb46d16b71` has fixture data in `db.json`

- **Load dashboard.** Click `Student`. Wait for loading skeletons to clear.
- **Completed program.** Snapshot under `Completed Programs` contains
  `Advanced 5-Axis Certification`.
- **No mock program.** Snapshot text does not contain `Q1 Safety Fundamentals`.
- **Data cross-check.** Run
  `curl -s "http://127.0.0.1:3001/enrollments?learnerId=6c541134-c0f6-41af-904a-1dcb46d16b71"`
  and confirm at least two records with `"status": "Completed"` for `prog_102` courses.
- **Proof.** Save snapshot to `/tmp/phillips-poc-verify-$VERIFY_RUN_ID/student-dashboard.aria.txt`.

## Gotchas

- Lists are disjoint: a completed program must not also appear under Assigned Programs
- Completion is computed by `isProgramComplete` in `src/lib/completion.ts`; every course in the
  program sequence needs a Completed enrollment for that program
- Legacy catalog fetch can be slow on first load; wait for skeletons to disappear before asserting
