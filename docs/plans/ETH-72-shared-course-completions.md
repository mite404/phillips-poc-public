---
linear: ETH-72
github: 116
filed: 2026-09-24
---

# ETH-72: Recognize shared course completions across programs

## Status

- **Goal**: Count a learner's completion of a Phillips course in every program that contains it,
  while retaining program-specific enrollment activity for supervisors.
- **Initial priority**: P1 (Linear: High)
- **Effort**: M
- **Risk**: MED - this changes the meaning of completion across the supervisor and learner views.
- **Depends on**: ETH-47's learner-scoped progress status
- **Category**: feature
- **Planned at**: 2026-09-24
- **Covers**: Linear ETH-72, GitHub mite404/phillips-poc-public#116

## Why this matters

A client program is a playlist of Phillips courses. A learner who completes a course through one
playlist should not have to complete identical material again because another playlist contains it.

Supervisors still need to know whether a learner acted on a particular assignment. That supports
reminders and forced enrollment without redefining what the learner has already completed.

Two facts therefore have different identities:

- **Assignment activity** is learner + program + course.
- **Learning completion** is learner + course.

## Current state

`CourseEnrollment` stores a learner ID, program ID, course ID, and optional status. The mock data
contains more than one enrollment record for some learner-course pairs, which can be valid when
registration activity comes from different program assignments.

`StudentProgressView` searches the selected learner's enrollments with `.find()` for a course ID.
The first record wins, so a registered record can hide another completed record for the same
course.

`StudentDashboard` filters a learner's enrollments to one program before calling
`isProgramComplete`. A completion earned through one program therefore does not count when the
same course appears in another program.

`RosterList` correctly keeps its enrollment check scoped to learner + program. That behavior must
remain unchanged because it answers the assignment-activity question.

## Approach

Create one pure learner-course status calculation. It receives a course ID and that learner's
enrollment records, then returns:

- `Completed` if any matching enrollment is completed.
- `Incomplete` if matching enrollments exist but none is completed.
- `Not Enrolled` if none exist.

Use the calculation in the supervisor progress view. Make `isProgramComplete` use the same rule,
and pass all of the learner's enrollments from `StudentDashboard` so a completed shared course
satisfies every playlist that requires it.

Do not deduplicate enrollment records. They are assignment history. Do not use a program ID for
course completion, because that would require a learner to repeat identical Phillips material.

## Scope

**In scope**

- `src/lib/completion.ts` - own the learner-course completion calculation and have program
  completion use it.
- `src/components/student/StudentDashboard.tsx` - pass the learner's complete enrollment set to
  program-completion logic.
- `src/components/progress/StudentProgressView.tsx` - use the shared calculation for row status.
- Focused tests for duplicate records, overlapping program playlists, and course-status priority.

**Out of scope**

- Removing duplicate enrollment records from `db.json` or production data.
- Changing `RosterList` program-scoped enrollment checks or its force-enrollment workflow.
- Adding new supervisor UI for reminders or forced enrollment.
- Redesigning the program builder.

## Steps

1. Write tests that distinguish learner-course completion from program-specific enrollment activity.
2. Extract the learner-course status calculation into `src/lib/completion.ts`.
3. Make `isProgramComplete` use that calculation for every course in a program's sequence.
4. Pass all learner enrollments to program completion in `StudentDashboard`.
5. Replace the local status lookup in `StudentProgressView` with the shared calculation.
6. Verify the roster still reports enrollment against the specific assigned program.

## Test plan

- Unit-test a learner with both registered and completed records for the same course. The result
  must be `Completed` regardless of record order.
- Unit-test two programs that share a course. Completing the course through Program A must make
  Program B complete once its other required courses are complete.
- Keep a program-specific roster test proving a learner can be complete in a shared course while
  still not enrolled in a separate assigned program.
- Run `bunx tsc --noEmit`, `bun run lint`, `bunx vitest run`, and `bun run build`.
- Run the repository's student-completion verification skill and inspect the affected supervisor
  and student states in the browser.

## Done when

- A completed learner-course record counts in every assigned program containing that course.
- A completed record wins over registered or unstated duplicate enrollment records.
- Program completion, supervisor progress, and learner progress agree on completed courses.
- Supervisor assignment tracking remains scoped to learner + program.
- Typecheck, lint, tests, build, and browser verification pass.

## Notes

ETH-47 corrected the status lookup from all learners to the selected learner. ETH-72 completes
that rule by defining how multiple records for the selected learner and course are combined.
