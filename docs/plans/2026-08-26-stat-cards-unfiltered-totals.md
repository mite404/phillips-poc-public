---
linear: ETH-47
github: 110
filed: 2026-08-26
---

# Correct per-student course status, and report unfiltered stat totals

Linear: <https://linear.app/mite404-workspace/issue/ETH-47>

## Status

- **Goal**: a course's status reflects that student's own enrollment record, and every summary
  card reports a total for its category unchanged by the filter toolbar.
- **Initial priority**: P1
- **Effort**: Medium
- **Risk**: MEDIUM
- **Category**: bug
- **Planned at**: commit `f0ccf84`, 2026-08-26
- **Found during**: ETH-9 end-to-end verification

## Why this matters

A supervisor opens this view to answer one question: where is this person up to. Every number
on the screen is an answer to that. Three of them are wrong, and they are wrong in the
direction that matters most, which is optimistic.

**Statuses are read from the wrong student.** `getCourseStatus` searches the entire
enrollments array, every learner in the system, for a matching `courseId`. It never narrows to
the student on screen. So a course counts as Incomplete for Alice because *Bob* is enrolled in
it. Alice Johnson has exactly **1** enrollment in the fixture and her view reports **13
Incomplete**. Twelve of those thirteen belong to other people. Scoped correctly she reads 5
Incomplete and 21 Not Enrolled.

**No course can ever be Completed.** The same function returns only `"Not Enrolled"` or
`"Incomplete"`. `db.json` holds two `"status": "Completed"` enrollments, both Bob Martinez's,
that can never surface. Downstream, `statusCompleted` and `completionPercentage` are pinned at
0 and the **Completed** option in the Status facet can never match a row.

**One stat card contradicts its own title.** Filter to a search matching nothing and
**Programs Assigned** drops from 6 to 0 while the student is still assigned to 6 programs. The
four cards beside it hold still, so the row reads as though the data is inconsistent rather
than the display. The cards sit above the toolbar and answer "what is the shape of this
workload"; the toolbar is how you go looking. Narrowing the table should not change the
answer, any more than zooming a timeline changes the runtime of the cut.

## Current state

`src/components/progress/StudentProgressView.tsx`.

**The status bug, line 371.** The closure picks the wrong array. Line 342 already computes
`studentEnrollments`, correctly narrowed to this learner, and the function ignores it in
favour of the raw `enrollments` source:

```tsx
const studentEnrollments = enrollments.filter((e) => e.learnerId === foundStudent.learnerId);
// ...
const getCourseStatus = (courseId: number): CourseStatus => {
  const isEnrolled = enrollments.find((e) => e.courseId === courseId); // every learner
  if (!isEnrolled) {
    return "Not Enrolled";
  } else {
    return "Incomplete"; // Completed is unreachable
  }
};
```

The tell is one line away. Inside the `flatMap` at line 388 the sibling field reads the
per-program `enrollments` destructured from `HydratedProgram`, which shadows the outer name and
is correctly scoped. So `row.enrollment` is right while `row.status`, assigned on the very next
line, is wrong. Two fields of the same object, computed from two different arrays.

`CourseEnrollment` in `src/types/models.ts:87-94` has no `status` field at all, so the branch
could not have been written against the type as it stands. The fixture is uneven about it: 3 of
11 enrollments carry `status`, the other 8 omit the key.

`ProgramProgressCard.old.tsx:40-46` does have a three-branch version, but it is not a lost
implementation to restore. Its `completedCourseIds` comes from `Math.random()` picking a course
to fake a demo percentage. There is no prior art here; the real branch has to be written.

**The stat bug, metrics effect at 405-431.** Five of six `StudentMetrics` fields read
`flatCourses`, the unfiltered list. `programsAssigned` alone builds its Set from a locally
filtered copy. That local `filteredCourses` is also a third copy of the filter predicate; the
component already computes an identical one at line 449. ETH-9 collapsed two copies of the
"are any filters active" boolean into one `hasActiveFilters`, and this is the same duplication
one level up, in the predicate itself.

**The card bug, line 578.** The card titled "Courses Completed" is passed
`value={metrics.completionPercentage}`, a percent. `MetricCard` renders `{value}` raw, no `%`
suffix and no rounding. `statusCompleted` is computed at 419 and rendered nowhere. Both are
always 0 today, which is the only reason nobody has noticed. Once statuses are correct, Bob
Martinez has 2 complete and the card starts printing a long decimal.

## Approach

Fix the derivation first, then the reporting. In that order, because the stat work is only
verifiable once statuses are real.

**Status.** Point `getCourseStatus` at `studentEnrollments` and give it the third branch. Add
`status` to `CourseEnrollment` as an optional union rather than a required field, so the 8
fixture rows that omit the key stay valid and `db.json` stays out of the diff. An absent
completion record meaning "not completed" is the honest reading, not a workaround.

```tsx
const getCourseStatus = (courseId: number): CourseStatus => {
  const enrollment = studentEnrollments.find((e) => e.courseId === courseId);
  if (!enrollment) return "Not Enrolled";
  return enrollment.status === "Completed" ? "Completed" : "Incomplete";
};
```

Rejected: backfilling `status` onto all 11 fixture rows to make the field required. It puts
`db.json` in the diff to buy a stricter type, and ETH-9's test plan already established that
committing fixture edits silently changes the app for everyone.

Rejected: matching on `courseId` alone even after scoping to the student. A learner registered
to two programs that share a course gets one enrollment row and two table rows. Narrowing to
`studentEnrollments` is enough for the reported defect and keeps the change small. If the same
course needs a different status per program, that is a data-model question, not a patch. See
Notes.

**Stats.** Make `programsAssigned` read `flatCourses` like its five siblings, and point the
Completed card at `statusCompleted`. Deleting the local `filteredCourses` copy is not a
separate cleanup, it is what the fix consists of: once nothing in the effect references it, the
dependency array collapses from four entries to one.

Rejected: filtering all six fields so the cards describe the current view. Four of them already
ignore the filter, so this means changing four correct cards to make one wrong one consistent.
A per-card "of N shown" sub-line is the design that serves both questions, and it is a real UI
change; its own ticket if the need is ever felt.

Step 5 is recommended, not required. With deps down to `[flatCourses]`, the `useState` plus
`useEffect` pair buys nothing except a render where the cards are stale. That is the hazard
written up in `docs/FOR_ETHAN.md` Director's Commentary #6, and here it is reachable:
`setFlatCourses` and `setIsLoading(false)` land before the metrics effect runs, so there is one
paint with real rows in the table and five zeros in the cards.

## Scope

In scope:

- `src/components/progress/StudentProgressView.tsx`: `getCourseStatus` at 371, the metrics
  effect at 405-431, the Completed card at 577-582.
- `src/types/models.ts`: add optional `status` to `CourseEnrollment` at 87-94.

Out of scope:

- `db.json`. The optional field is chosen precisely so the fixture needs no edit.
- Per-program status for a course a student holds in two programs. See Notes.
- Adding an "of N shown" sub-line or any other new affordance to the cards.
- `MetricCard` itself. It renders what it is handed; nothing about it is wrong.
- Rounding or formatting `completionPercentage`. It stops being displayed after step 4.
- `ProgramProgressCard.old.tsx`. Dead, imported nowhere, and deleting it is its own chore.
- The `if (flatCourses.length === 0) return;` guard at line 407. See Notes.

## Steps

1. Add `status?: "Registered" | "Completed";` to `CourseEnrollment` in `src/types/models.ts`.
2. Rewrite `getCourseStatus` to look up `studentEnrollments` and return `"Completed"` when the
   enrollment says so. Confirm it no longer references the outer `enrollments`.
3. In the metrics effect, change `programsAssigned` to build its Set from `flatCourses`, delete
   the now-unreferenced local `filteredCourses` block, and reduce the deps to `[flatCourses]`.
4. Change the Courses Completed card to `value={metrics.statusCompleted}`.
5. Recommended: replace the `metrics` `useState` and its effect with a derived value computed
   in the component body, matching how `filteredCourses` and `hasActiveFilters` already work in
   this file. Delete the initial-state object at 265-272.

## Test plan

The component has no test harness; ETH-39 owns that. Verify by running the app. Both students
below are load-bearing: Alice proves the leak is gone, Bob proves Completed is reachable.

1. `bun dev`, open **Alice Johnson**'s Progress view. Courses Incomplete should read **5**, not
   13, and Courses Not Enrolled should rise correspondingly. Alice holds 1 enrollment.
2. Open **Bob Martinez**. Courses Completed should be **2**, a plain integer, and two rows
   should show a Completed status badge.
3. With Bob open, select the **Completed** option in the Status facet. It should match those 2
   rows. Before this fix it matches nothing for every student.
4. Back on Alice, note all five card values with no filters set. Programs Assigned reads 6.
5. Type `zzzzz` into the filter box. The table empties. All five cards hold their values.
   Before this fix Programs Assigned drops to 0.
6. Clear the filter, then select a Level facet matching a subset, then combine search and both
   facets. Cards hold throughout.
7. If step 5 was taken, watch the cards during a fresh page load. They should go from skeletons
   straight to real values, with no frame of zeros between.
8. `git status --short db.json` prints nothing.

## Done when

* A course's status is derived only from the displayed student's own enrollments
* Alice Johnson reports 5 Incomplete, not 13
* Bob Martinez reports 2 Completed, and the Completed status facet matches those rows
* Filtering by search, Status, or Level leaves all five card values unchanged
* Programs Assigned reports the count of programs the student is registered to, always
* The Courses Completed card is fed `metrics.statusCompleted`, not `completionPercentage`
* The metrics effect references `flatCourses` only, and its dependency array is `[flatCourses]`
* No copy of the filter predicate remains inside the metrics effect
* `db.json` is not in the diff
* `bunx tsc --noEmit` exits 0, `bun run lint` exits 0, `bunx vitest run` passes 31
* `bun run build` exits 0

## Notes

**Risk is MEDIUM, up from LOW when this ticket covered only the cards.** Step 2 changes what
every row in the table says, so the numbers a supervisor has been looking at will move. They
were wrong before and will be right after, but "the counts changed" is the expected outcome
here, not a regression to chase.

**Why the numbers move so much.** The current lookup answers "is anyone enrolled in this
course", which trends toward Incomplete as the fixture grows. The corrected one answers "is
*this* student enrolled", which is a far smaller set. Expect Incomplete to fall and Not
Enrolled to rise for every student.

**The duplicate-course case, deliberately left alone.** `getCourseStatus` matches on `courseId`
only. A student registered to two programs that share a course gets one enrollment row and two
table rows, so both rows show the same status even if only one program's copy was completed.
Narrowing to `studentEnrollments` does not change that. Fixing it means matching on
`(programId, courseId)`, which is a data-model question worth its own ticket; the fixture
already has learners in this shape.

**A latent divide-by-zero.** `completionPercentage` divides by `flatCourses.length`, `NaN` at
zero courses. The `if (flatCourses.length === 0) return;` guard on line 407 prevents it, at the
cost of leaving the cards showing the previous student's values rather than zeros. Step 5 would
remove the effect and force this to be handled directly. Left alone here because nothing in
this plan changes the arithmetic.

**Front-matter carries the identifier only, not the URL.** The repo's `wrap-md` pre-commit hook
wraps any line past 100 columns, including inside YAML front-matter, and
`linear_url: <full url>` is 118. Wrapping it split the value onto its own line and
`ticket_state.py read` then returned `{}`, which reads as "unfiled" and would have filed a
duplicate on the next run. `linear: ETH-47` is 14 columns and survives. The URL is re-derivable
from the identifier, which the skill already specifies as the fallback. The hook should skip
front-matter; that is its own fix.

**Scope divergence.** Filed as a stat-card display fix. Widened on the operator's call after
verification turned up the status-derivation bug underneath it, which is the more severe of the
two and which the card work cannot be checked without.

**Related.** ETH-9 removed the duplicated `hasActiveFilters` boolean from this file. ETH-40
covers splitting the 800-line component, at which point these metrics are an obvious
extraction. ETH-39 covers the missing test suite, and the three empty-state branches plus these
status branches all belong in it.
