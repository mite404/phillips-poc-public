---
linear: ETH-38
github: 104
filed: 2026-08-27
---
# ETH-38: Compute program completion instead of hardcoding it - Tutorial

**Goal:** `StudentDashboard` decides which programs are complete by reading enrollment data,
through one shared rule that lives in `src/lib/completion.ts` and is called from both places
that currently hardcode a boolean.

**Learning Style:** Hybrid (fill-in-blanks + guided concepts)  
**Prerequisites:** TypeScript interfaces, `Array.prototype.every` / `.some`, basic React state

> **How to work this document**: follow it in order. Run every verification command and confirm
> the expected result before moving on. Attempt each `TODO(you)` before opening its Solution -
> the Solution is an answer key for checking a real attempt, not a walkthrough. If anything in
> "STOP conditions" occurs, stop and report - do not improvise.
>
> **Drift check (run first)**:
> `git diff --stat 8b1c686..HEAD -- src/components/student/StudentDashboard.tsx src/types/models.ts`
> If those files changed since this was written, compare the "Current state" excerpts against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

---

## Table of Contents

**Before you start**

1. [Why this matters](#why-this-matters)
2. [Current state](#current-state)
3. [Commands You'll Need](#commands-youll-need)
4. [Concepts You'll Need](#concepts-youll-need)
5. [Scope](#scope)
6. [Files You'll Touch](#files-youll-touch)
7. [Git workflow](#git-workflow)
8. [Background Concepts](#background-concepts)

**The work**

9. [Phase 1: Model the data and write the rule](#phase-1-model-the-data-and-write-the-rule)
10. [Phase 2: Call the rule from the dashboard](#phase-2-call-the-rule-from-the-dashboard)

**Finishing**

11. [Test plan](#test-plan)
12. [Done criteria](#done-criteria)
13. [STOP conditions](#stop-conditions)
14. [Maintenance notes](#maintenance-notes)

**What you take with you**

15. [What You Should Know Now](#what-you-should-know-now)
16. [Stretch Goals](#stretch-goals)
17. [Advanced Techniques & Alternate Solutions](#advanced-techniques--alternate-solutions)
18. [Reference](#reference)

---

## Status

- **Initial priority**: P1 (Linear: High)
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `8b1c686`, 2026-08-27
- **Covers**: Linear ETH-38, GitHub mite404/phillips-poc-public#104

---

## Why this matters

`src/components/student/StudentDashboard.tsx` never computes completion. It writes the answer
in by hand, in both directions:

- **Line 140** pushes every real assigned program with `isCompleted: false`.
- **Line 176** builds one fake program named `"Q1 Safety Fundamentals"` with `isCompleted: true`
  and hands it to `setCompletedPrograms` on line 178.

So the "Completed" section of the student dashboard shows a program that does not exist in
`db.json`, and a student who has genuinely finished a program never sees it move. The two
displayed lists are decorations, not derived state.

The reason this survived is that the data needed to compute the answer is real but invisible to
TypeScript. Enrollment records in `db.json` carry a `status` field (`"Completed"`,
`"Registered"`), but `CourseEnrollment` in `src/types/models.ts:87-94` does not declare it. The
field is loaded at runtime by `localApi.getEnrollments()` and then dropped on the floor, because
nothing in the type system says it is there to read.

That is why this ticket is not "wire up the existing helper". There is no existing helper. The
rule has to be defined, and defining it is the actual work: you are deciding what "complete"
means for this product.

---

## Current state

`src/components/student/StudentDashboard.tsx` - the learner-facing dashboard, 467 lines.

The local shape it renders (lines 29-33):

```typescript
interface HydratedProgram {
  program: SupervisorProgram;
  courses: Course[];
  isCompleted: boolean;
}
```

Note this is a *different* `HydratedProgram` from the exported one in `src/types/models.ts:115`,
which has `enrollments` and no `isCompleted`. Same name, two shapes, two files.

The enrollments are already fetched and filtered to this student (lines 106-110):

```typescript
// Filter enrollments for this student
const myEnrollments = allEnrollments.filter(
  (e) => e.learnerId === MOCK_STUDENT.learnerId,
);
setEnrollments(myEnrollments);
```

The first hardcode, inside the program hydration loop (lines 137-141):

```typescript
hydratedPrograms.push({
  program,
  courses,
  isCompleted: false, // TODO: Check completion logic
});
```

The second, a fabricated program pushed straight into the completed list (lines 160-178):

```typescript
// Mock: Add one completed program for demo
// In real implementation, this would check completion status
const mockCompletedProgram: HydratedProgram = {
  program: {
    id: "completed_mock",
    supervisorId: "pat_mann_guid",
    programName: "Q1 Safety Fundamentals",
    description: "Basic safety training completed",
    tags: ["Safety", "Completed"],
    courseSequence: [116, 11],
    published: true,
    createdAt: "2025-09-01T10:00:00Z",
  },
  courses: [116, 11]
    .map((courseId) => coursesMap.get(courseId))
    .filter((course): course is Course => course !== undefined),
  isCompleted: true,
};
setCompletedPrograms([mockCompletedProgram]);
```

The type that is missing the field, `src/types/models.ts:87-94`:

```typescript
export interface CourseEnrollment {
  id: string; // UUID
  learnerId: string; // GUID
  programId: string; // UUID
  courseId: number;
  classId: number;
  enrolledDate: string; // ISO date string
}
```

### The partial exemplar

The closest thing to a completion rule in this repo is `getCourseStatus` in
`src/components/progress/StudentProgressView.tsx:359-367` (do **NOT** edit that file - it is
shown only as an exemplar, and it is Ticket ETH-40's territory):

```typescript
// Populate flatCourses.status from getCourseStatus()
const getCourseStatus = (courseId: number): CourseStatus => {
  const isEnrolled = enrollments.find((e) => e.courseId === courseId);

  if (!isEnrolled) {
    return "Not Enrolled";
  } else {
    return "Incomplete";
  }
};
```

Read that carefully before you continue, because it is an exemplar of the *shape* and a
counter-example of the *content*: it derives status from enrollments, which is right, but it can
only ever return `"Not Enrolled"` or `"Incomplete"`. **It never returns `"Completed"`.** That is
why `statusCompleted` and `completionPercentage` on the supervisor's progress view
(`StudentProgressView.tsx:407` and `:411-414`) are always `0`. Same root cause as your bug, in a
different file. Fixing it there is out of scope here - see Maintenance notes.

---

## Commands You'll Need

**Project toolchain**

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Install deps (do this before going offline) | `bun install` | `9 packages installed`, exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0, no output |
| Lint | `bun run lint` | exit 0, prints `check-tailwind-v4-syntax: no v3 bracket-syntax classes in src/` |
| Tests | `bunx vitest run` | `Test Files 4 passed (4)`, `Tests 56 passed (56)` |
| Build | `bun run build` | exit 0, artifacts in `dist/` |

**Run the thing you're changing**

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Start app + mock API | `bun dev` | Vite on `5173`, json-server on `3001` |
| Confirm json-server is up | `curl -s localhost:3001/enrollments \| head -c 80` | a JSON array starting `[{"id":"enroll_` |
| Read the student's enrollments | `curl -s "localhost:3001/enrollments?learnerId=6c541134-c0f6-41af-904a-1dcb46d16b71"` | 9 records |
| Open the student dashboard | visit `http://localhost:5173` and switch to the Student persona | the Assigned / Completed sections render |

**External tools & dependencies**

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Bun installed | `bun --version` | `>= 1.4` |
| `motion` package present | `ls node_modules/motion` | a directory listing, not `No such file` |
| `curl` available | `command -v curl` | a path |

> **Offline warning.** Commit `8b1c686` added `motion@13.1.1` as a dependency. If
> `ls node_modules/motion` says `No such file or directory`, run `bun install` **while you still
> have a network**, or `bunx vitest run` will fail to load
> `src/components/progress/__tests__/StudentProgressView.test.tsx` with
> `Failed to resolve import "motion/react"` and you will lose your test safety net.

---

## Concepts You'll Need

- **Derived state vs. stored state** - `isCompleted` is a fact you can *compute* from
  enrollments, so storing a hand-written copy of it guarantees the copy goes stale. This is the
  whole bug. *Taught in Background Concepts and Phase 1.*
- **Two vocabularies that share a word** - an *enrollment* status (`"Registered"`,
  `"Completed"`) is not a *course* status (`CourseStatus` = `"Completed" | "Incomplete" | "Not
  Enrolled"`, `models.ts:130`). They overlap on one string and mean different things. *Taught in
  Phase 1.*
- **Guarding an optional field at the boundary** - 8 of the 11 enrollment records in `db.json`
  have no `status` key at all. Your rule has to be correct when the field is absent, not just
  when it is present. *Taught in Phase 1.*
- **`every` over a sequence** - the rule quantifies over `program.courseSequence`, so the shape
  of the answer is "for all courses, there exists an enrollment such that...". *Assumed - skim
  [MDN on
  Array.prototype.every](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every)
  if the `every` / `some` pairing is not automatic for you.*

---

## Scope

**In scope** (the only files you should modify):

- `src/types/models.ts` - add the enrollment status field and its type.
- `src/lib/completion.ts` - **new file**, the rule.
- `src/components/student/StudentDashboard.tsx` - call the rule at both hardcoded sites.

**Out of scope** (do NOT touch):

- `src/components/progress/StudentProgressView.tsx` - its `getCourseStatus` (line 359) has the
  same root cause and never returns `"Completed"`, but that file is being restructured by Ticket
  ETH-40 and editing both at once will make the two diffs impossible to review independently.
  Adopting your new helper there is Stretch Goal 1.
- `src/components/progress/ProgramProgressCard.old.tsx` - verified orphaned (nothing outside the
  file imports it). It is dead code and deleting it is a legitimate cleanup, but not while you
  are changing completion semantics: a reviewer needs to see those as separate decisions.
- `db.json` - the fixture already contains the `status` values you need. If you find yourself
  editing it to make the feature work, your rule is wrong, not the data.
- `src/api/localRoutes.ts` - `getEnrollments()` (line 214) already returns the raw records
  including `status`. No transport change is needed.

---

## Files You'll Touch

One change, 4 files (3 modified, 1 read). Build them leaf-first: the type nothing depends on,
then the pure rule, then the component that calls it.

| # | File | Role | Contains | Yours or read? |
|---|------|------|----------|----------------|
| A | `src/components/progress/StudentProgressView.tsx` | Supervisor progress view | `getCourseStatus` at line 359 - the shape to copy, the content to reject | **Read** - exemplar, do not edit |
| B | `src/types/models.ts` | Shared type definitions | `CourseEnrollment` (87-94), `CourseStatus` (130) | **Build** - 1 stub |
| C | `src/lib/completion.ts` | *New.* The completion rule | 1 CALCULATION | **Build** - 1 stub |
| D | `src/components/student/StudentDashboard.tsx` | Student dashboard | 2 hardcoded sites (140, 176) inside 1 ACTION | **Build** - 2 stubs |

**How they connect:** D imports C; C imports B's types; A imports B but is untouched. Data flows
`db.json` → `localApi.getEnrollments()` → `myEnrollments` (D, line 107) → C's rule → D's
`isCompleted`.

**Build order:** B → C → D. The type has to exist before the rule can read `.status` without a
compiler error, and the rule has to exist before the component can call it. Equally important,
B and C are checkable on their own (`bunx tsc --noEmit`) while D can only be checked by running
the app - so you want the leaves proven before you touch the part that needs a browser.

---

## Git workflow

- Branch `feature/eth-38-fix-the-hardcoded-iscompleted-false-in-studentdashboard` (Linear's
  generated name), or `mite404/eth-38-compute-program-completion` if you prefer it short.
- Commit message: `fix: derive program completion from enrollment status`.
- Do NOT push or open a PR unless the operator instructed it.

---

## Background Concepts

### What is derived state? (First Principles)

**What is it?**  
A value you can always recompute from data you already hold. `isCompleted` is derived: given a
program's `courseSequence` and the learner's enrollments, the answer is fully determined. Nothing
else needs to be remembered.

**Real-world analogy:** a film's runtime is derived from the edit. You do not store "97 minutes"
in a field and hope someone updates it when a scene is cut - you measure the timeline. The moment
you write the number down somewhere separate, you have created two sources of truth and one of
them is going to be wrong. Line 140 is that written-down number.

**Key pieces you'll use:**

#### 1. `SupervisorProgram.courseSequence`

- **What:** the ordered list of course IDs a program requires
- **When:** read once per program, when deciding completion
- **Returns:** `number[]`

#### 2. `CourseEnrollment.status` (the field you are about to declare)

- **What:** the learner's state for one course in one program
- **When:** present on some records only - 3 of 11 in `db.json`
- **Returns:** `"Registered" | "Completed" | undefined`

### How the completion check works

**Purpose:** answer "has this learner finished this program?" with no I/O.

**Flow:**

```text
1. Take the program's courseSequence            (number[])
2. Take the learner's enrollments for that program (CourseEnrollment[])
3. For every course id in the sequence...
4. ...is there some enrollment for that course whose status is "Completed"?
5. All of them yes -> complete. Any of them no -> not complete.
```

**Classification note:** step 1-2 are **Data** (inert values already in memory). Steps 3-5 are a
**Calculation** - same inputs, same answer, every time, no network. The `loadStudentData`
function that eventually calls it is an **Action** (it fetches and calls `setState`). The whole
point of this ticket is to keep steps 3-5 out of that Action: *prefer data to calculations, and
calculations to actions.*

One subtlety worth naming now. `myEnrollments` arrives from a network call, so it is tempting to
think anything reading it is an Action. It is not. By the time your rule runs, `myEnrollments` is
just an array sitting in memory - a snapshot. The impurity was sealed inside the fetch. Everything
downstream that only *reads* that array is free to be a Calculation, and should be.

---

## Phase 1: Model the data and write the rule

**Concepts:** derived state, enrollment status vs. course status, guarding an optional field,
`every`/`some`

### Concept: two vocabularies that share the word "Completed"

**Picture it first:** on a film set, "wrapped" means two different things depending on who says
it. A *actor* is wrapped when their last scene is shot. The *production* is wrapped when every
actor is. Same word, two scopes, and confusing them is how someone goes home on day three.

**What is it?** This codebase has exactly that pair, and only one half is currently typed:

- `CourseStatus` (`models.ts:130`) = `"Completed" | "Incomplete" | "Not Enrolled"`. This is the
  *derived, per-course, display* status. It is what the supervisor's table renders.
- The enrollment record's own `status` in `db.json` = `"Registered"` or `"Completed"`, or the key
  is missing entirely. This is the *stored, per-enrollment, source* status.

They overlap on the string `"Completed"` and on nothing else. `"Registered"` is not a
`CourseStatus`, and `"Not Enrolled"` is not an enrollment status - it is the *absence* of an
enrollment.

**Why?** If you type the new field as `CourseStatus`, you have told the compiler that
`"Not Enrolled"` is a legal stored value and that `"Registered"` is not. Both are backwards, and
the type will actively mislead the next person. See "Why this matters" for what the current
missing-field version already cost.

**How it works:**

```typescript
// The stored vocabulary - what a record in db.json actually carries
export type EnrollmentStatus = "Registered" | "Completed";

// The derived vocabulary - what the UI shows. Already exists at models.ts:130.
export type CourseStatus = "Completed" | "Incomplete" | "Not Enrolled";
```

**Key:** name the vocabulary after where the value comes from, not after what it looks like.

---

### Step 1.1: Add the field, then write the rule

**CATEGORY: Data (the type) then Calculation (the rule)** - no I/O in this phase at all.

First, `src/types/models.ts`. Add the type next to `CourseStatus` (line 130) and the field to
`CourseEnrollment` (lines 87-94):

```typescript
// ── DATA ────────────────────────────────────────────────────
// TODO(you) 1: declare EnrollmentStatus, then add a status field to
//   CourseEnrollment. Two decisions to make before you type anything:
//   (a) 8 of the 11 records in db.json have no `status` key. Does that make the
//       field optional, or does it make it required with a fallback somewhere
//       else? Which choice makes the compiler force you to handle the gap at
//       the point where you read it?
//   (b) Should "Not Enrolled" be one of EnrollmentStatus's members? Go look at
//       what an absent enrollment record means before you answer.
```

Then create `src/lib/completion.ts`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
import type { CourseEnrollment } from "@/types/models";

// ── 2. CALCULATION ──────────────────────────────────────────
// CATEGORY: Calculation - courseSequence + enrollments in, boolean out. No I/O.

/**
 * True when every course in `courseSequence` has at least one enrollment
 * for this learner marked `"Completed"`.
 *
 * @param courseSequence - the program's required course ids, in order
 * @param enrollments - the learner's enrollments, already filtered to one program
 */
export function isProgramComplete(
  courseSequence: number[],           // in: number[]
  enrollments: CourseEnrollment[],    // in: CourseEnrollment[]
): boolean {                          // out: boolean
  // TODO(you) 2: implement the rule.
  //
  //   Shape it from the sentence, not from code you remember: "for EVERY course
  //   in the sequence, there EXISTS an enrollment for that course that is
  //   Completed." Two quantifiers, nested. Which array method is each one?
  //
  //   Three traps, all of them real in this data:
  //   - There are DUPLICATE enrollment rows. Course 11 in prog_102 appears
  //     twice, once "Completed" and once with no status at all. Does a method
  //     that stops at the FIRST match give you the right answer here? Try
  //     `.find(...)` on paper against that pair before you commit to it.
  //   - `status` may be undefined. What does comparing undefined to a string
  //     return, and is that the answer you want?
  //   - An empty courseSequence. What does `every` return on an empty array,
  //     and is "a program with no courses is complete" the behavior you want
  //     the dashboard to show? Decide deliberately; either answer can be
  //     defended, but write down which one you chose.
  return false; // remove when implemented
}
```

**Verify:** `bunx tsc --noEmit` exits 0, and
`grep -n "status" src/types/models.ts` shows your new field.

---

### Step 1.2: Work Through It

**TODO 1:** declare the stored vocabulary and attach it to the record.

**Conceptual Process:**

1. Look at what the data actually contains. `curl -s localhost:3001/enrollments` (with `bun dev`
   running) or just read `db.json`. Count how many records have `status`.
2. A field that is absent on most records is not the same as a field that is always present. Which
   TypeScript modifier expresses "may not be there", and what does it force callers to do?
3. Consider the alternative: required field with a default applied when the API response is
   parsed. That is a real option - it is Alternate Solution 2 below. Why is it more work *here*,
   given there is no parsing layer between `getEnrollments()` and the component?

**Why this approach?** Marking it optional pushes the "what if it's missing" decision to the one
place that actually cares (your rule), instead of inventing a value at load time that the rest of
the app then cannot distinguish from a real one.

**TODO 2:** implement the rule.

**Conceptual Process:**

1. Write the English sentence first, with both quantifiers explicit. "For every X, there exists a
   Y such that Z."
2. Map each quantifier to a method. There are exactly two candidates and they are not
   interchangeable here.
3. Now attack it with the duplicate-row case: `prog_102`, course `11`, two enrollment records, one
   `"Completed"` and one with no `status`. Walk both candidate implementations through that pair
   by hand. One of them returns the wrong answer depending on array order. That is the lesson -
   find it before you write code.
4. Decide the empty-sequence behavior and leave a one-line comment saying which you chose and why.

**Why this approach?** Taking `courseSequence` and `enrollments` as parameters (rather than
reaching for a program object, or for module state) is what keeps this a Calculation you can test
with two literals and no mocks. It is also dependency injection in miniature: the caller supplies
the data, so the function never has to know where it came from.

---

### Step 1.3: Quiz Yourself

1. `getCourseStatus` in `StudentProgressView.tsx:359` uses `.find()` and returns `"Incomplete"`
   for anyone with an enrollment. Given the duplicate rows in `db.json`, name a concrete case
   where `.find()` returns a record that makes the answer wrong, and say why `.some()` does not
   have that problem.
2. Is `isProgramComplete` a Calculation even though `enrollments` came from a `fetch` three
   function calls earlier? Justify with the snapshot rule.
3. Predict: if you typed the new field as `CourseStatus` instead of `EnrollmentStatus`, which
   line of your rule would still compile but be wrong? What would the compiler *fail* to catch?
4. What does `[].every(fn)` return? Is that the right answer for a program with an empty
   `courseSequence`, from a student's point of view?

---

### ✅ Solution

**TODO 1** - `src/types/models.ts`, added beside `CourseStatus` (line 130) and inside
`CourseEnrollment` (lines 87-94):

```typescript
/** What a stored enrollment record carries. Distinct from CourseStatus, which is derived. */
export type EnrollmentStatus = "Registered" | "Completed";

export interface CourseEnrollment {
  id: string; // UUID
  learnerId: string; // GUID
  programId: string; // UUID
  courseId: number;
  classId: number;
  enrolledDate: string; // ISO date string
  status?: EnrollmentStatus; // absent on 8 of 11 db.json records
}
```

**TODO 2** - `src/lib/completion.ts`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
import type { CourseEnrollment } from "@/types/models";

// ── 2. CALCULATION ──────────────────────────────────────────
export function isProgramComplete(
  courseSequence: number[],                        // in: number[]
  enrollments: CourseEnrollment[],                 // in: CourseEnrollment[]
): boolean {                                       // out: boolean
  // An empty sequence is not a completed program - a program with no courses
  // has not been "finished" in any sense a learner would recognise.
  if (courseSequence.length === 0) return false;   // → boolean

  return courseSequence.every((courseId) =>        // → boolean
    enrollments.some(                              // → boolean
      (e) => e.courseId === courseId && e.status === "Completed",
    ),
  );
}
```

**Why this works:** `every` quantifies over the required courses and `some` quantifies over the
learner's records for each one, which is the English sentence transcribed directly. `some` is what
makes the duplicate rows harmless: course `11` in `prog_102` has one `"Completed"` record and one
with no `status`, and `some` only needs the first to be true regardless of order. `.find()` would
have returned whichever row came first in the array and then tested only that one - correct by
luck today, wrong the moment json-server returns them in a different order.

The `status === "Completed"` comparison also handles the missing field for free: `undefined ===
"Completed"` is `false`, no guard needed. Because the field is optional, TypeScript would have
stopped you from writing `e.status.toLowerCase()` without a check - the optionality is doing real
work, not decoration.

**Why split it this way?**

- **`isProgramComplete` is a Calculation** - you can tell because both inputs are parameters and
  the output depends on nothing else: no `fetch`, no `Date.now()`, no component state. It was
  extracted because it is *a calculation hiding inside an action* (reason 1 in the
  extract-or-inline test), and because it needs two call sites in Phase 2 (reason 3). What got
  easier: it is testable with two array literals and zero mocks.
- **It takes `courseSequence`, not a `SupervisorProgram`** - passing the whole program object
  would couple the rule to a shape it does not need, and would make a test construct a full
  program just to check a boolean. Take the narrowest input that answers the question.
- **`EnrollmentStatus` is Data** - an inert fact about the vocabulary. Preferring data to
  calculations shows up here: naming the two legal strings in a type means no runtime validation
  code has to exist to enforce it.
- **Deliberately NOT extracted:** the `e.courseId === courseId && e.status === "Completed"`
  predicate stays inline. A named `isCompletedEnrollmentFor(courseId)` helper would add a name to
  read and a level of indirection to save nothing - the expression already says what it means.
  This is the "when not to extract" case: a single obvious expression, used once, whose name would
  be no clearer than the code.

---

### Step 1.4: Run It

```bash
bunx tsc --noEmit && bunx vitest run
```

**Expected Output:**

```text
 Test Files  4 passed (4)
      Tests  56 passed (56)
```

Typecheck prints nothing and exits 0. Test count is unchanged - you have not written a test yet
and have not broken one.

**If it fails:**

- `Property 'status' does not exist on type 'CourseEnrollment'` → TODO 1 was not applied, or was
  applied to the wrong interface. There is only one `CourseEnrollment` (`models.ts:87`).
- `Failed to resolve import "motion/react"` → stale `node_modules`. Run `bun install`. This is
  not your change; see the Offline warning in Commands You'll Need.
- `Type 'string' is not assignable to type 'EnrollmentStatus'` → you compared against a string
  not in the union. Check your spelling against `db.json`; the value is `"Completed"`, capital C.

> **Work order:** fill stubs in dependency order - DATA (the type) before CALCULATION (the rule)
> before the ACTION that calls it in Phase 2 - and re-run after each. A leaf you have verified is
> a fixed point you can trust while debugging the trunk.

---

### ✅ Phase 1 Complete

You've learned:

- Why a value that can be recomputed should never also be stored by hand.
- How to name two vocabularies that share a word so the type system keeps them apart.
- Why `some` and `find` are not interchangeable once duplicate records exist.
- That data arriving from the network does not make the code reading it impure.

**Next:** Phase 2 - replacing both hardcoded booleans with a call to the rule you just wrote.

---

## Phase 2: Call the rule from the dashboard

**Concepts:** keeping an Action thin, partitioning a list, deleting fixture code

### Concept: the Action's job is to gather and apply, not to decide

**Picture it first:** the director does not operate the camera or mix the sound. They take the
assembled cut, point at it, and say "that one, ship it." When a director starts colour-grading
individual shots, two things go wrong: they become the bottleneck, and nothing they touched can be
reused on the next production.

**What is it?** `loadStudentData` (line 71) is an **Action**: it fetches from three APIs, awaits,
and calls five `setState` functions. Actions are where ordering and timing bugs live. Every
decision you can lift out of one and into a Calculation is a decision that becomes testable
without a browser.

**Why?** Right now `loadStudentData` contains a *decision* - "this program is not complete" - baked
in as the literal `false` on line 140. After Phase 1 that decision lives in
`isProgramComplete`. Phase 2's job is to make the Action *call* the rule rather than *be* the
rule, and to shrink it in the process by deleting the 17-line fake program.

**How it works:**

```typescript
// The Action gathers inputs, calls the Calculation, applies the result to state.
const enrollmentsForProgram = myEnrollments.filter((e) => e.programId === program.id);
const complete = isProgramComplete(program.courseSequence, enrollmentsForProgram);
```

**Key:** if a line inside an async function decides something, ask whether it could have been
decided by a pure function given the right arguments. If yes, it is in the wrong place.

---

### Step 2.1: Replace both hardcoded sites

**CATEGORY: Action (the loop and the setState calls) calling a Calculation.**

In `src/components/student/StudentDashboard.tsx`. Current state of the hydration loop
(lines 137-141):

```typescript
hydratedPrograms.push({
  program,                                              // → SupervisorProgram
  courses,                                              // → Course[]
  isCompleted: false, // TODO: Check completion logic   // ← the lie
});

// TODO(you) 3: replace `false` with the real answer.
//   isProgramComplete needs two things. `program.courseSequence` you already
//   have. The enrollments you need are NOT `myEnrollments` as-is - look at what
//   that variable holds (line 107) and at the second parameter's contract in
//   your JSDoc. What is the difference, and which line has to exist before this
//   one? Note the loop variable is `assignment`, and it has a programId.
```

Then the fake program and its setter (lines 160-178):

```typescript
// Mock: Add one completed program for demo
// In real implementation, this would check completion status
const mockCompletedProgram: HydratedProgram = { /* ...17 lines... */ };
setCompletedPrograms([mockCompletedProgram]);            // ← shows a program that does not exist

// TODO(you) 4: this whole block goes away. `hydratedPrograms` now knows which
//   entries are complete, so both lists can come from it.
//
//   The design decision, and it is yours: `setAssignedPrograms` on line 158
//   currently receives ALL programs. Should the "Assigned" section keep showing
//   completed programs too, or should the two lists be disjoint? Go look at how
//   each list renders (lines 257-261 for assigned, 372-378 for completed) and at
//   what the section headings say, then decide. Write one line of comment
//   recording the choice.
//
//   Whichever you choose, derive both lists from the same array in one pass.
//   Deriving one and hand-writing the other is the bug you are here to fix.
```

**Verify:** `grep -n "isCompleted: false\|isCompleted: true\|mockCompletedProgram"
src/components/student/StudentDashboard.tsx` returns no matches.

---

### Step 2.2: Work Through It

**TODO 3:** feed the rule the right enrollments.

**Conceptual Process:**

1. Read line 107 again. `myEnrollments` is filtered by `learnerId` only - it spans every program
   the student touches.
2. Your rule's second parameter is documented as "already filtered to one program". Whose job is
   that filtering, the caller's or the rule's? You wrote the contract in Phase 1; honour it.
3. The loop body already has the program in hand. Which property matches against the enrollment's
   `programId`?

**Why this approach?** Filtering at the call site keeps the rule ignorant of program identity, so
it stays a two-argument function you can test with literals. The alternative - passing all
enrollments plus a program id and filtering inside - is Alternate Solution 1 below; it is not
wrong, it is just a different contract, and mixing the two is what produces a function that
filters twice.

**TODO 4:** derive both lists.

**Conceptual Process:**

1. You have one array where each element now carries a truthful `isCompleted`. Two lists have to
   come out of it.
2. There is a one-pass shape (`reduce`) and a two-filter shape. Both are fine; the two-filter
   version is more readable and the array is tiny. Pick for clarity, not for a performance
   difference you cannot measure at n=5.
3. Before you write it, answer the UX question in the TODO. Look at the empty-state text on line
   372 and the heading above line 378. A "Completed" section that also appears in "Assigned" is
   defensible if the headings say "All assigned" - check what they actually say.
4. Delete the mock. All 17 lines, plus the two comments above it. If you find yourself keeping
   any of it "just in case", that is the fixture instinct that created this bug.

**Why this approach?** Both lists coming from one array in one place means there is exactly one
statement about completion in the whole component. That is the property the ticket asks for
("the rule lives in one place, not duplicated per call site") and it is why the two lists can
never again disagree.

---

### Step 2.3: Quiz Yourself

1. If you had passed `myEnrollments` unfiltered to `isProgramComplete`, the dashboard would show
   *more* completed programs than it should, not fewer. Explain the mechanism using the real data:
   course `11` appears in `prog_101`, `prog_102`, and two others.
2. `loadStudentData` is an Action. After Phase 2, name every decision still made inside it, and
   say for each whether it could be a Calculation.
3. The mock program had `id: "completed_mock"`, which matches nothing in `db.json`. What would
   have happened if a user had clicked one of its courses? Does deleting it fix a second bug you
   were not asked about?
4. Predict: a student completes their last course and `db.json` gains one `"Completed"` record.
   How many lines of `StudentDashboard.tsx` need to change for the UI to reflect it?

---

### ✅ Solution

**TODO 3** - `src/components/student/StudentDashboard.tsx`, the hydration loop:

```typescript
// Enrollments for THIS program only - isProgramComplete's contract expects a single program.
const programEnrollments = myEnrollments.filter(       // → CourseEnrollment[]
  (e) => e.programId === assignment.programId,
);

hydratedPrograms.push({
  program,                                             // → SupervisorProgram
  courses,                                             // → Course[]
  isCompleted: isProgramComplete(                      // → boolean
    program.courseSequence,
    programEnrollments,
  ),
});
```

**TODO 4** - replacing lines 158-178:

```typescript
// Completed programs move out of Assigned: the two dashboard sections are disjoint,
// so a finished program appears once, under "Completed".
setAssignedPrograms(hydratedPrograms.filter((p) => !p.isCompleted));  // → HydratedProgram[]
setCompletedPrograms(hydratedPrograms.filter((p) => p.isCompleted));  // → HydratedProgram[]
```

And add the import at the top of the file:

```typescript
import { isProgramComplete } from "@/lib/completion";
```

**Why this works:** every element of `hydratedPrograms` now carries a computed `isCompleted`, so
partitioning it with two complementary filters produces two lists that cannot disagree - they are
reading the same boolean. The 17-line `mockCompletedProgram` is gone, and with it the only place
in the component that asserted a completion answer instead of deriving one.

Against the real fixture this moves exactly one program. The student
(`6c541134-c0f6-41af-904a-1dcb46d16b71`) has five distinct registered programs; only
`prog_102` "Advanced 5-Axis Certification" has every course in its sequence (`[11, 131]`) covered
by a `"Completed"` enrollment. The other four have none.

**Why split it this way?**

- **The loop body stays an Action, and that is correct** - it pushes to an array declared outside
  itself, which is mutation. It was not extracted into a helper because it does one obvious thing
  per iteration and a `hydrateProgram()` wrapper would need five parameters to replace three
  lines. Not every chunk inside an Action wants to be a function.
- **`programEnrollments` is a Calculation result, computed in the Action** - this is the normal
  shape: the Action gathers, the Calculation decides. The filter is one expression used once, so
  it stays inline rather than becoming `enrollmentsFor(program, all)`.
- **The two `filter` calls are Calculations** - pure, no mocks needed to test. They replaced an
  Action that fabricated data (`setCompletedPrograms([mockCompletedProgram])`). That is the
  preference rule paying off concretely: a side-effecting line that invented a program became two
  derivations over data you already had.

---

### Step 2.4: Run It

```bash
bunx tsc --noEmit && bun run lint && bunx vitest run
```

**Expected Output:**

```text
 Test Files  4 passed (4)
      Tests  56 passed (56)
```

Then run the app and look at it:

```bash
bun dev
```

**Expected:** on the Student persona, the "Completed" section shows **Advanced 5-Axis
Certification**, and **Q1 Safety Fundamentals no longer appears anywhere** - it never existed
outside line 166.

**If it fails:**

- Completed section is empty → your rule is returning `false` for `prog_102`. Check that you
  filtered enrollments by `programId` and not by `courseId`, and that you used `some` not `every`
  on the inner array.
- Every program shows as completed → you passed unfiltered `myEnrollments`, so course `11`'s
  `"Completed"` record in `prog_102` is satisfying the check for every program containing course
  `11`.
- `Q1 Safety Fundamentals` still shows → the mock block was not deleted, only unreferenced.

---

### ✅ Phase 2 Complete

You've learned:

- How to keep an Action thin by moving its decisions into a Calculation it calls.
- Why deriving two lists from one array removes a whole class of disagreement bug.
- That deleting fixture code is part of the fix, not a follow-up.

---

## Test plan

There is a `vitest` harness here (`vitest.config.ts`, 4 suites, 56 tests) and
`isProgramComplete` is a pure two-argument function, so unit-testing it is cheap and
proportionate - unlike the hook script case where you would skip it. Writing that test is Stretch
Goal 2; this plan verifies by running the real app, because the bug is a rendering bug and the
proof is what a student sees.

1. **Setup.** `bun install` (if `ls node_modules/motion` fails), then `bun dev`. Confirm
   json-server is up: `curl -s localhost:3001/enrollments | head -c 80` prints a JSON array.
2. **Confirm the fixture supports exactly one completion** - this is what your UI should match:

    ```bash
    curl -s "localhost:3001/enrollments?learnerId=6c541134-c0f6-41af-904a-1dcb46d16b71" \
      | grep -o '"status":"[^"]*"' | sort | uniq -c
    ```

    → `2 "status":"Completed"` and `1 "status":"Registered"`. The other 6 records have no
    `status` key, which is why they do not appear.
3. **The completed program is the right one** - open `http://localhost:5173`, switch to the
   Student persona, scroll to the Completed section.

    → shows **Advanced 5-Axis Certification** and nothing else. **Before this change it showed
    "Q1 Safety Fundamentals"**, a program with no record in `db.json` - so the specific proof that
    the fix worked is that the program name *changed*, not merely that the section is non-empty.
4. **Incomplete programs stayed incomplete** - the Assigned section still lists the remaining
   four programs (`Q3 Safety Ramp-up` among them). A dashboard where everything moved to Completed
   means unfiltered enrollments; see "If it fails" in Step 2.4.
5. **Teardown.** Stop `bun dev` (Ctrl-C). `git status` should show exactly three modified files
   and one new file.

**If a step fails:** see the per-step "If it fails" blocks in Steps 1.4 and 2.4 - they cover the
five failure modes this change actually produces.

---

## Done criteria

Machine-checkable. ALL must hold. Tick these as you go - an unticked box in **Per phase** means go
back to that phase; an unticked box in **Final gates** means the work is done but not yet clean.

**Per phase**

- [ ] Phase 1 - `grep -n "EnrollmentStatus" src/types/models.ts` returns at least two matches
      (the type and the field)
- [ ] Phase 1 - `src/lib/completion.ts` exists and `bunx tsc --noEmit` exits 0
- [ ] Phase 2 - `grep -n "isCompleted: false\|isCompleted: true\|mockCompletedProgram"
  src/components/student/StudentDashboard.tsx`
      returns no matches
- [ ] Phase 2 - `grep -n "isProgramComplete" src/components/student/StudentDashboard.tsx` returns
      exactly two matches (the import and the call)
- [ ] Test plan step 3 - the Completed section shows "Advanced 5-Axis Certification"
- [ ] Test plan step 3 - `grep -rn "Q1 Safety Fundamentals" src/` returns no matches

**Final gates**

- [ ] `bunx tsc --noEmit` exits 0
- [ ] `bun run lint` exits 0 with no new warnings
- [ ] `bunx vitest run` → `Tests 56 passed (56)` (unchanged)
- [ ] `bun run build` exits 0
- [ ] No files outside `src/types/models.ts`, `src/lib/completion.ts`, and
      `src/components/student/StudentDashboard.tsx` are modified (`git status`)

---

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" do not match the live code (drift since `8b1c686`). The line
  numbers in the Linear ticket (122 and 156) are already stale - they were written against an
  older commit and the real lines are 140 and 176. If yours are different again, something landed
  after this document.
- Both hardcodes are replaced and the Completed section still shows "Q1 Safety Fundamentals" -
  something else renders it, and guessing widens the blast radius.
- `bunx vitest run` reports fewer than 56 passing tests after your change. Nothing here should
  affect the existing suites; a drop means you edited something out of scope.
- You conclude the completion rule needs data that `db.json` does not contain (a completion date,
  a passing grade, an assessment score). That is a product question, not an implementation
  detail - report it rather than inventing a field.

---

## Maintenance notes

- **The same bug exists in `StudentProgressView.tsx`.** `getCourseStatus` (line 359) never returns
  `"Completed"`, which is why `statusCompleted` (line 407) and `completionPercentage`
  (lines 411-414) are permanently `0` on the supervisor's view. Your `isProgramComplete` is
  per-program; that site needs a per-course sibling. Do not fix it in this PR - Ticket ETH-40 is
  restructuring that file. See Stretch Goal 1.
- **`ProgramProgressCard.old.tsx` is dead.** Verified: nothing outside the file imports it. It
  deserves deletion in its own commit, deliberately not here.
- **A reviewer should check** that `grep -rn "isCompleted:" src/` shows only the interface
  declaration at `StudentDashboard.tsx:32` and the one computed assignment - no literals.
- **Deliberately deferred:** this plan does not add a unit test for `isProgramComplete`. The
  function is pure and trivially testable, which is exactly why it is a good first exercise on
  your own (Stretch Goal 2) rather than something to copy from here.
- **Deliberately deferred:** duplicate enrollment rows in `db.json` (course 11 / `prog_102`
  appears twice). Your rule tolerates them by design, but the fixture itself is questionable and
  a real API would likely reject the second insert.

---

## What You Should Know Now

**You can now do, unaided:**

- Spot a stored value that should be derived, and say what it costs: two sources of truth, one of
  which is silently wrong.
- Choose between `some` and `find` correctly by testing a candidate against duplicate records
  instead of against the happy path.
- Give two overlapping vocabularies distinct types so the compiler stops a category error rather
  than waving it through.
- Move a decision out of an async function and into a pure function, and explain what got easier
  (testable with literals, no mocks, no browser).

**Now true about this codebase:**

- `CourseEnrollment` records in `db.json` carry a `status` the TypeScript type did not declare
  until you added it. When a fixture has a field the interface lacks, the app is blind to it.
- `CourseStatus` (`models.ts:130`) is the *derived* display vocabulary; `EnrollmentStatus` is the
  *stored* one. `"Registered"` and `"Not Enrolled"` belong to different halves.
- `getCourseStatus` in `StudentProgressView.tsx:359` is structurally right and behaviourally
  incomplete - it can never return `"Completed"`. Any "completion is always zero" report on the
  supervisor view starts there.
- There are two different `HydratedProgram` types, one exported from `models.ts:115` and one local
  to `StudentDashboard.tsx:29`. They are not interchangeable.

**Check yourself:**

1. A teammate reports the supervisor's "Completion %" tile is stuck at 0 for every student. You
   have not seen that code. What is your first grep, and why that one before opening any
   component?
2. You are asked to add a "Certified" state that requires a passing score in addition to
   completion. Which of the two vocabularies gains a member, and which function changes? What
   makes you confident it is only one function?
3. Why does `isProgramComplete` take `courseSequence: number[]` rather than
   `program: SupervisorProgram`? Name the specific thing that would get harder with the second
   signature.

---

## Stretch Goals

**Teach `StudentProgressView` to say "Completed"** - the supervisor's progress table has three
status facets, a `STATUS_ORDER` that ranks `Completed` highest (`courseTable.ts:33-37`), and a
metric tile for completion percentage. None of them can ever fire, because `getCourseStatus`
(`StudentProgressView.tsx:359-367`) only returns `"Not Enrolled"` or `"Incomplete"`. Every one of
those features is dead UI today.

> Copy this prompt to get a tutorial for it:
> `In the phillips-poc-public repo, src/components/progress/StudentProgressView.tsx defines
> getCourseStatus at line 359 which returns only "Not Enrolled" or "Incomplete" and can never return
> "Completed", so StudentMetrics.statusCompleted and completionPercentage are always 0 and the
> "Completed" filter facet matches nothing. A per-program rule already exists in
> src/lib/completion.ts (isProgramComplete). Create a tutorial that adds a per-course sibling
> reading CourseEnrollment.status === "Completed", moves getCourseStatus out of the component's
> useEffect into a pure exported calculation, and verifies the Completed metric tile and status
> facet both come alive. Note that ticket ETH-40 may be restructuring this file concurrently - have
> the tutorial check for that first.`

**Unit-test the completion rule** - `isProgramComplete` is a pure function with two array
parameters and three interesting edge cases you reasoned about but never pinned down: duplicate
enrollment rows, a missing `status` field, and an empty `courseSequence`. Right now nothing stops
someone changing `some` back to `find`.

> Copy this prompt to get a tutorial for it:
> `In the phillips-poc-public repo, src/lib/completion.ts exports isProgramComplete(courseSequence:
> number[], enrollments: CourseEnrollment[]): boolean. It has no tests. The repo uses vitest (see
> vitest.config.ts) with existing suites in src/components/progress/__tests__/courseTable.test.ts to
> copy the style from. Create a tutorial that writes src/lib/__tests__/completion.test.ts covering:
> all courses completed, one course missing, duplicate enrollment rows where only one is marked
> Completed, an enrollment with no status field, an empty courseSequence, and enrollments belonging
> to a different program. Explain why each case exists rather than just asserting it.`

**Give the student dashboard a real learner** - `MOCK_STUDENT` is hardcoded at
`StudentDashboard.tsx:29-40` with a comment saying "Hardcoded logged-in student (Liam - ID 1511)"
while the name field says "Bob Martinez". The same instinct that produced the mock completed
program produced this, and it will mislead the next person the same way.

> Copy this prompt to get a tutorial for it:
> `In the phillips-poc-public repo, src/components/student/StudentDashboard.tsx hardcodes a
> MOCK_STUDENT object at lines 29-40 whose comment says "Liam - ID 1511" but whose learnerName is
> "Bob Martinez", and every data fetch filters on MOCK_STUDENT.learnerId. Create a tutorial that
> lifts the current learner into a prop or context so the component receives it, updates
> src/components/PageContent.tsx which renders it, and keeps a single clearly-labelled dev default
> rather than an inline literal. Cover why a fixture that disagrees with its own comment is worse
> than no fixture.`

---

## Advanced Techniques & Alternate Solutions

### Pass all enrollments and filter inside the rule

```typescript
export function isProgramComplete(program: SupervisorProgram, all: CourseEnrollment[]): boolean {
  const mine = all.filter((e) => e.programId === program.id);   // → CourseEnrollment[]
  return program.courseSequence.every((id) =>
    mine.some((e) => e.courseId === id && e.status === "Completed"));
}
```

**When this wins:** when there is more than one call site and every caller would otherwise write
the same `.filter` line first. Moving the filter inside removes a way to call it wrongly - and
"caller forgot to filter" is a real failure mode, the one that would have made every program show
as complete. **Crossover:** at one or two call sites the narrow signature is better, because it
keeps the function testable with two literals instead of a full `SupervisorProgram`. You have two
call sites and they are adjacent, so it stays a close call. If a third appears, switch.

### Compute completion once, at the API boundary

```typescript
// in localRoutes.ts - enrichment as the data arrives
const enrollments = raw.map((e) => ({ ...e, status: e.status ?? "Registered" }));
```

**When this wins:** when many components need the same derived field and each is currently
recomputing it, or when you want the default to be explicit rather than implied by `undefined`.
It centralises the "missing field" decision in one place. **Why it loses here:** there is no
parsing or normalisation layer in `localRoutes.ts` today - `getEnrollments` (line 214) returns
the response as-is - so this would mean inventing that layer for one field, and it would also
erase the distinction between "genuinely registered" and "we don't know". **Crossover:** the
moment a second component needs to read `status`, or the moment you add runtime validation
(Zod/Valibot) at the boundary, do this instead.

### Store `isCompleted` on the enrollment record (worse here, better elsewhere)

```json
{ "id": "enroll_888", "programId": "prog_102", "isProgramComplete": true }
```

Persist the answer rather than deriving it. **Why it loses here:** it is the exact bug you just
removed, one layer down. The stored flag goes stale the instant a course is added to
`courseSequence`, and nothing in the system would notice. **Where it wins:** when the derivation
is genuinely expensive (an aggregate over millions of rows), or when you must preserve a
*historical* fact - "this learner completed this program under the 2025 curriculum" is not
recomputable after the curriculum changes, so it has to be stored. **Crossover:** store the answer
only when the inputs are allowed to change underneath it and you need the old answer to survive.
That is a different requirement from the one you have.

### Considered and rejected

- **Typing the new field as `CourseStatus`.** Rejected: it would admit `"Not Enrolled"` as a
  stored value (meaningless - absence is how you say that) and reject `"Registered"` (which is
  actually in the data). The types would be precisely backwards.
- **Making `status` required with a `"Registered"` default.** Rejected: 8 of 11 fixture records
  have no `status`, so a required field would be a lie about the data, and TypeScript would stop
  reminding you to handle the gap at the point where it matters.
- **Keeping the mock program behind a flag** for demos. Rejected: the mock is what made the bug
  invisible. A demo that shows a program which does not exist is not a demo, and a flag would just
  relocate the confusion into config.

---

## Reference

### Common Patterns

#### Two nested quantifiers over a required sequence

```typescript
// "for every required X, there exists a record satisfying P"
required.every((x) => records.some((r) => matches(r, x) && satisfies(r)));
```

Reach for this whenever a checklist has to be fully satisfied and the evidence may be duplicated,
partial, or out of order. `find` is the wrong tool the moment duplicates are possible.

#### Naming a stored vocabulary apart from a derived one

```typescript
export type EnrollmentStatus = "Registered" | "Completed";              // stored
export type CourseStatus = "Completed" | "Incomplete" | "Not Enrolled"; // derived
```

---

### Troubleshooting

**Problem:** `Property 'status' does not exist on type 'CourseEnrollment'`  
**Solution:** Phase 1 TODO 1 was skipped or applied to the wrong interface. There is one
`CourseEnrollment`, at `src/types/models.ts:87`.

**Problem:** Every program shows as completed  
**Solution:** you passed `myEnrollments` unfiltered. Course `11` has a `"Completed"` record in
`prog_102` and appears in four programs' sequences, so it satisfies the check everywhere. Filter
by `programId` at the call site.

**Problem:** `Failed to resolve import "motion/react"` when running tests  
**Solution:** stale `node_modules` after commit `8b1c686` added `motion@13.1.1`. Run
`bun install`. Unrelated to your change.

**Problem:** Completed section is empty rather than showing one program  
**Solution:** you used `every` on the inner array instead of `some`, so the duplicate
no-status record for course `11` fails the check.

---

### Key Takeaways

1. A value that can be recomputed from data you already hold should never also be stored by hand.
2. When a fixture has a field the TypeScript interface lacks, the application is blind to it - and
   "there is no logic to reuse" can be true while "there is no data to use" is false.
3. `some` and `find` differ the moment duplicate records exist; test candidates against the
   duplicate, not the happy path.
4. Two vocabularies sharing one string need two types, or the compiler will wave through a
   category error.
5. Deleting the fixture is part of the fix. The mock is usually why nobody noticed.

---

### Full Reference Implementation

```typescript
// src/types/models.ts - added beside CourseStatus (line 130)
/** What a stored enrollment record carries. Distinct from CourseStatus, which is derived. */
export type EnrollmentStatus = "Registered" | "Completed";

// src/types/models.ts - CourseEnrollment, lines 87-94 after the change
export interface CourseEnrollment {
  id: string; // UUID
  learnerId: string; // GUID
  programId: string; // UUID
  courseId: number;
  classId: number;
  enrolledDate: string; // ISO date string
  status?: EnrollmentStatus; // absent on 8 of 11 db.json records
}
```

```typescript
// src/lib/completion.ts - new file, complete

// ── 1. IMPORTS ──────────────────────────────────────────────
import type { CourseEnrollment } from "@/types/models";

// ── 2. CALCULATION ──────────────────────────────────────────

/**
 * True when every course in `courseSequence` has at least one enrollment
 * for this learner marked `"Completed"`.
 *
 * @param courseSequence - the program's required course ids, in order
 * @param enrollments - the learner's enrollments, already filtered to one program
 */
export function isProgramComplete(
  courseSequence: number[],                        // in: number[]
  enrollments: CourseEnrollment[],                 // in: CourseEnrollment[]
): boolean {                                       // out: boolean
  // An empty sequence is not a completed program - a program with no courses
  // has not been "finished" in any sense a learner would recognise.
  if (courseSequence.length === 0) return false;   // → boolean

  return courseSequence.every((courseId) =>        // → boolean
    enrollments.some(                              // → boolean
      (e) => e.courseId === courseId && e.status === "Completed",
    ),
  );
}
```

```typescript
// src/components/student/StudentDashboard.tsx - the three changed regions

// ── IMPORTS (top of file) ───────────────────────────────────
import { isProgramComplete } from "@/lib/completion";

// ── inside loadStudentData: the hydration loop, replacing lines 137-141 ──
const programEnrollments = myEnrollments.filter(       // → CourseEnrollment[]
  (e) => e.programId === assignment.programId,
);

hydratedPrograms.push({
  program,                                             // → SupervisorProgram
  courses,                                             // → Course[]
  isCompleted: isProgramComplete(                      // → boolean
    program.courseSequence,
    programEnrollments,
  ),
});

// ── replacing lines 158-178 (the mock program is deleted entirely) ──
// Completed programs move out of Assigned: the two dashboard sections are disjoint,
// so a finished program appears once, under "Completed".
setAssignedPrograms(hydratedPrograms.filter((p) => !p.isCompleted));  // → HydratedProgram[]
setCompletedPrograms(hydratedPrograms.filter((p) => p.isCompleted));  // → HydratedProgram[]
```

---

**End of Tutorial**
