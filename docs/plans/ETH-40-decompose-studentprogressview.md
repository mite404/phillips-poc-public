---
linear: ETH-40
github: 106
filed: 2026-08-27
---
# ETH-40: Decompose StudentProgressView - Tutorial

**Goal:** `StudentProgressView.tsx` drops from 749 lines to roughly 520 by moving its three
inline sub-components into their own files, and its metrics stop being computed inside a
state-syncing `useEffect`.

**Learning Style:** Hybrid (fill-in-blanks + guided concepts)  
**Prerequisites:** React function components, props, `useState` / `useEffect` / `useMemo`,
TypeScript generics at the level of `<T extends string>`

> **How to work this document**: follow it in order. Run every verification command and confirm
> the expected result before moving on. Attempt each `TODO(you)` before opening its Solution -
> the Solution is an answer key for checking a real attempt, not a walkthrough. If anything in
> "STOP conditions" occurs, stop and report - do not improvise.
>
> **Drift check (run first)**:
> `git diff --stat 8b1c686..HEAD -- src/components/progress/`
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

9. [Phase 1: Extract FacetFilter](#phase-1-extract-facetfilter)
10. [Phase 2: Extract SortHeader and ColumnToggle](#phase-2-extract-sortheader-and-columntoggle)
11. [Phase 3: Stop syncing metrics through an
    effect](#phase-3-stop-syncing-metrics-through-an-effect)

**Finishing**

12. [Test plan](#test-plan)
13. [Done criteria](#done-criteria)
14. [STOP conditions](#stop-conditions)
15. [Maintenance notes](#maintenance-notes)

**What you take with you**

16. [What You Should Know Now](#what-you-should-know-now)
17. [Stretch Goals](#stretch-goals)
18. [Advanced Techniques & Alternate Solutions](#advanced-techniques--alternate-solutions)
19. [Reference](#reference)

---

## Status

- **Initial priority**: P2 (Linear: Medium)
- **Effort**: M
- **Risk**: MED - this is a behaviour-preserving refactor of a component with a live test suite
  and one real consumer. The risk is not in any single edit; it is in changing behaviour by
  accident while moving code.
- **Depends on**: none
- **Category**: refactor
- **Planned at**: commit `8b1c686`, 2026-08-27
- **Covers**: Linear ETH-40

> **The Linear ticket was rewritten on 2026-08-27 to match this document.** Two claims in its
> original body were stale, both verified against `8b1c686`:
>
> 1. **The file is 749 lines, not 809.** It shrank after the ticket was filed.
> 2. **"the level/status filter predicate is written twice" was no longer true.** It was fixed.
>    `src/components/progress/courseTable.ts` now exists and holds a single `matchesFilters`
>    (line 59); its header comment says so explicitly. Both the metrics pass and the render pass
>    call the same `filterCourses`. There is still a real problem in that area, but it is not
>    duplication - see Phase 3.

---

## Why this matters

`src/components/progress/StudentProgressView.tsx` is 749 lines. Three of its four components are
declared inline above the one that is exported:

| Component | Lines | Size |
| --- | --- | --- |
| `FacetFilter` | 68-165 | 98 |
| `SortHeader` | 166-214 | 49 |
| `ColumnToggle` | 215-248 | 34 |
| `StudentProgressView` (exported) | 249-749 | 501 |

The 181 lines above the export are pure presentational components. None of them reads the
component's state, none of them fetches anything, and all three take everything they need through
props. They are already decoupled - they just have no file.
`docs/plans/2026-03-11-table-filter-sort-view.md` defined each of them as a discrete
sub-component; they were only ever written inline.

The cost is concrete and you can feel it right now: to read how a status facet toggles, you scroll
past 98 lines of Popover markup that has nothing to do with the table. To find where sorting is
applied, you scroll past all three. The exported component's own logic does not start until line
249.

There is also a second, subtler problem in the same file. Lines 396-419 compute the metrics inside
a `useEffect` that then calls `setMetrics`. Every one of those six numbers is derivable from
`flatCourses` in a single pass with no I/O - so this is a calculation being run as a side effect,
which costs an extra render on every keystroke in the search box and creates a window where
`metrics` disagrees with the table beneath it. Phase 3 is that fix.

---

## Current state

`src/components/progress/StudentProgressView.tsx` - the supervisor's read-only progress tracker
for one learner, 749 lines. Rendered from `src/components/PageContent.tsx:41`.

The type that travels with `FacetFilter` (lines 62-66):

```typescript
interface FacetOption<T> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}
```

`FacetFilter`'s signature (lines 68-80) - note it is generic, and note it is not exported:

```typescript
function FacetFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
```

`SortHeader`'s signature (lines 166-178):

```typescript
function SortHeader({
  col,
  label,
  sort,
  onSort,
  onHide,
}: {
  col: SortCol;
  label: string;
  sort: { col: string | null; dir: "asc" | "desc" };
  onSort: (col: SortCol, dir: "asc" | "desc") => void;
  onHide: () => void;
}) {
```

Look closely at the `sort` prop: it is typed `col: string | null`, but the state it receives
(line 267) is `col: SortCol | null`. The prop type is *wider* than the value. That is a small type
leak you will fix while moving the file.

`ColumnToggle`'s signature (lines 215-221):

```typescript
function ColumnToggle({
  hiddenCols,
  onToggle,
}: {
  hiddenCols: Set<ColKey>;
  onToggle: (col: ColKey) => void;
}) {
```

The metrics effect (lines 396-419) - the Phase 3 target:

```typescript
// Calculate metrics from flat data
useEffect(() => {
  if (flatCourses.length === 0) return;

  // Count unique programs from currently filtered courses
  const filteredCourses = filterCourses(flatCourses, {
    levels: selectedLevels,
    statuses: selectedStatuses,
    search: searchText,
  });

  const metrics: StudentMetrics = {
    statusCompleted: flatCourses.filter((course) => course.status === "Completed").length,
    statusIncomplete: flatCourses.filter((course) => course.status === "Incomplete").length,
    statusNotEnrolled: flatCourses.filter((course) => course.status === "Not Enrolled").length,
    totalCourses: flatCourses.length,
    completionPercentage:
      (flatCourses.filter((course) => course.status === "Completed").length /
        flatCourses.length) *
      100,
    programsAssigned: new Set(filteredCourses.map((course) => course.program.id)).size,
  };

  setMetrics(metrics);
}, [flatCourses, selectedLevels, selectedStatuses, searchText]);
```

Immediately below it, lines 421-431, the same filter runs again - this time correctly, as a plain
derived value:

```typescript
// filteredCourses is 'derived state' computed from other state on every render
const filteredCourses = filterCourses(flatCourses, {
  levels: selectedLevels,
  statuses: selectedStatuses,
  search: searchText,
});

const hasActiveFilters =
  selectedStatuses.length > 0 || selectedLevels.length > 0 || searchText !== "";

const sortedCourses = sortCourses(filteredCourses, sort);
```

### The exemplar

The correct pattern already exists next door, in `src/components/progress/courseTable.ts`
(do **NOT** edit that file - it is shown only as the exemplar). Its header:

```typescript
// CALCULATIONS: pure filter/sort/column rules behind the student progress table.
// Kept out of StudentProgressView so both the metrics pass and the render pass
// share one predicate instead of two copies that can drift.
```

That file is what a finished extraction looks like in this repo: a banner comment naming the
category, pure functions, JSDoc on the exported ones, no React import. Lines 421-431 above are
what correct derived state looks like. You are making the rest of the file match code that is
already here.

---

## Commands You'll Need

**Project toolchain**

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Install deps (do this before going offline) | `bun install` | `9 packages installed`, exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0, no output |
| Lint | `bun run lint` | exit 0, prints `check-tailwind-v4-syntax: no v3 bracket-syntax classes in src/` |
| Tests | `bunx vitest run` | `Test Files 4 passed (4)`, `Tests 56 passed (56)` |
| This file's suite only | `bunx vitest run src/components/progress` | `Tests 12 passed (12)` |
| Watch this suite while refactoring | `bunx vitest src/components/progress` | re-runs on save |
| Build | `bun run build` | exit 0, artifacts in `dist/` |

**Run the thing you're changing**

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Start app + mock API | `bun dev` | Vite on `5173`, json-server on `3001` |
| Line count of the target | `wc -l src/components/progress/StudentProgressView.tsx` | `749` before, ~`520` after |
| Confirm nothing else imports the sub-components | `grep -rn "FacetFilter\|SortHeader\|ColumnToggle" src/ \| grep -v "components/progress/"` | no output |
| Open the view | `bun dev`, then pick a student from the supervisor roster | the metrics row and course table render |

**External tools & dependencies**

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Bun installed | `bun --version` | `>= 1.4` |
| `motion` package present | `ls node_modules/motion` | a directory listing, not `No such file` |

> **Offline warning.** Commit `8b1c686` added `motion@13.1.1`. If `ls node_modules/motion` says
> `No such file or directory`, run `bun install` **while you still have a network**, or
> `bunx vitest run` will fail to load this component's own test suite with
> `Failed to resolve import "motion/react"`. On this ticket that matters more than usual: the
> test suite is your only proof that a behaviour-preserving refactor preserved behaviour.

---

## Concepts You'll Need

- **Refactor means the tests do not change** - every edit here must leave all 56 tests passing
  without touching a single assertion. If a test needs editing, you have changed behaviour, not
  moved it. *Taught in Background Concepts.*
- **Props are the seam** - a component whose entire input arrives through props can move to any
  file without rewiring, because it never reached for anything ambient. This is why these three
  are easy and the table is not. *Taught in Phase 1.*
- **Generic components** - `FacetFilter<T extends string>` is generic so `Status` and `Level`
  facets both type-check against their own value unions. Moving it means moving its type parameter
  and the `FacetOption<T>` it depends on. *Taught in Phase 1.*
- **Derived state vs. synced state** - a value computable from existing state during render should
  not be stored in `useState` and pushed there by an effect. *Taught in Phase 3.*

---

## Scope

**In scope**:

- `src/components/progress/FacetFilter.tsx` - **new file**
- `src/components/progress/SortHeader.tsx` - **new file**
- `src/components/progress/ColumnToggle.tsx` - **new file**
- `src/components/progress/StudentProgressView.tsx` - delete the three inline definitions, add
  three imports, replace the metrics effect

**Out of scope** (do NOT touch):

- **Extracting the table itself.** The Linear ticket says "plus the table itself", and that is
  genuinely the largest remaining chunk - but it needs roughly ten props threaded through
  (`sortedCourses`, `hiddenCols`, `sort`, `toggleCol`, `setSort`, `hasActiveFilters`,
  `clearFilters`, `getStatusClassName`, and the loading and empty states). It is where a
  behaviour-preserving refactor is most likely to stop preserving behaviour, and it deserves its
  own review. Do it as a follow-up with these three extractions already merged and green -
  Stretch Goal 1 has the prompt.
- `src/components/progress/courseTable.ts` - already correct, already the exemplar. The predicate
  duplication the ticket mentions was fixed when this file was created.
- `src/components/progress/__tests__/StudentProgressView.test.tsx` - **must not change.** It is
  the instrument you are measuring with. If a refactor requires editing a test, stop; see STOP
  conditions.
- `getCourseStatus` (line 359) - it never returns `"Completed"`, which is a real bug making
  `statusCompleted` permanently `0`. It is the same root cause as Ticket ETH-38 and is being
  handled there. Do not fix behaviour inside a refactor: a reviewer must be able to tell
  "moved code" from "changed code" at a glance.
- `src/components/progress/ProgramProgressCard.old.tsx` - orphaned dead code, verified unimported.
  Deleting it is a separate cleanup commit.

---

## Files You'll Touch

One change, 5 files (4 new or modified, 1 read). Build leaf-first: each new component depends on
nothing in this set, and the trunk imports all three.

| # | File | Role | Contains | Yours or read? |
|---|------|------|----------|----------------|
| A | `src/components/progress/courseTable.ts` | Pure table rules | The extraction pattern this repo already uses | **Read** - exemplar, do not edit |
| B | `src/components/progress/FacetFilter.tsx` | *New.* Faceted filter dropdown | 1 generic component + `FacetOption<T>` | **Build** - 1 stub |
| C | `src/components/progress/SortHeader.tsx` | *New.* Sortable column header | 1 component | **Build** - 1 stub |
| D | `src/components/progress/ColumnToggle.tsx` | *New.* Show/hide columns menu | 1 component | **Build** - 1 stub |
| E | `src/components/progress/StudentProgressView.tsx` | The trunk | 3 deletions, 3 imports, 1 effect replaced | **Build** - 2 stubs |

**How they connect:** E imports B, C, and D. B, C, and D import only from `@/components/ui/*`,
`lucide-react`, and `./courseTable` - never from E. That one-directional dependency is what makes
the extraction safe; if any of them needed something from E you would have a cycle and a design
problem.

**Build order:** B → C → D → E, and within E do the three import swaps (Phases 1-2) before the
effect rewrite (Phase 3). Reason: Phases 1 and 2 are pure moves that the test suite can prove
byte-for-byte behaviour-neutral, so if a test breaks you know it broke on a move. Phase 3 is the
only phase that changes *when* code runs. Doing it last means it is the only suspect if the suite
goes red at the end.

---

## Git workflow

- Branch `feature/eth-40-decompose-studentprogressview` - Linear's generated name, now that the
  ticket title is short enough to slugify cleanly.
- Commit per phase, not one big commit. Three commits:
  - `refactor: extract FacetFilter into its own file`
  - `refactor: extract SortHeader and ColumnToggle into their own files`
  - `refactor: derive progress metrics instead of syncing them in an effect`
- Do NOT push or open a PR unless the operator instructed it.

Committing per phase is not bookkeeping here - it is the safety mechanism. If the suite goes red
after Phase 3, `git diff HEAD~1` shows you exactly the change that did it, with the two pure moves
already banked.

---

## Background Concepts

### What is a behaviour-preserving refactor? (First Principles)

**What is it?**  
A change to the structure of code that provably does not change what it does. The proof is
external: a test suite that passed before, passes after, and was not itself edited.

**Real-world analogy:** re-cutting a film's negative onto new reels. The projected movie is
identical frame for frame; only the physical organisation changed. If the audience notices
anything at all, you did not re-reel it - you re-edited it. And the way you know is that you
screen it for the same audience with the same reaction sheet, not a new one.

**Key pieces you'll use:**

#### 1. The test suite as instrument

- **What:** `src/components/progress/__tests__/StudentProgressView.test.tsx`, 6 tests
- **When:** after every single edit, not at the end
- **Returns:** `Tests 12 passed (12)` for the `progress` directory (6 here + 6 in
  `courseTable.test.ts`)

The suite renders the real component with the two API modules mocked (lines 11-24) and asserts on
what a user sees: row counts, empty states, search narrowing, column hiding, metric values, sort
order. That is exactly the right instrument for this job, because it is coupled to behaviour and
not to structure. It never imports `FacetFilter`, so moving `FacetFilter` cannot break it - unless
you changed something while moving.

#### 2. The props seam

- **What:** the complete set of inputs a component receives
- **When:** examined *before* moving anything, to confirm the component reads nothing else
- **Returns:** a decision - movable as-is, or needs prop-threading first

**Real-world analogy:** a lamp with a plug can move to any room. A lamp wired into the wall cannot
move until you give it a plug. `FacetFilter`, `SortHeader`, and `ColumnToggle` all have plugs
already. The table does not, which is exactly why it is out of scope.

### How the refactor loop works

**Purpose:** move code without changing behaviour, and know it at every step.

**Flow:**

```text
1. Run the suite. Confirm green BEFORE you touch anything.
2. Move one component to a new file. Add the export.
3. Delete the inline definition. Add the import.
4. Typecheck, then run the suite.
5. Green -> commit. Red -> undo step 2-3 and look at what you changed while moving.
```

**Classification note:** all three extracted components are **Orchestration** in this skill's
extended vocabulary - they compose UI primitives and call the callbacks handed to them, but
compute nothing and touch nothing outside. `StudentProgressView` itself is **Main**: the entry
point that owns state, runs the fetch effect, and wires everything to React. `courseTable.ts` is
pure **Calculation**. Phase 3's whole point is the preference rule - moving six numbers from being
produced by an Action (an effect that calls `setMetrics`) to being produced by a Calculation
(derived during render). *Prefer data to calculations, and calculations to actions.*

---

## Phase 1: Extract FacetFilter

**Concepts:** props as the seam, generic components, moving a type with its consumer

### Concept: a component with a plug can move to any room

**Picture it first:** on a set, a practical light that is battery-powered and stands on its own
can be carried to any stage. One that is spliced into the building's mains cannot move until an
electrician gives it a plug. Same light, entirely different job to relocate it.

**What is it?** A component whose entire input arrives through props has a plug. `FacetFilter`
(lines 68-80) takes `label`, `options`, `selected`, `onToggle`, `onClear` and reads nothing else -
no state from `StudentProgressView`, no context, no module-level variable from that file. Check
this claim yourself before you move it; that check is the actual skill.

**Why?** Because it decides whether this is a two-minute move or a prop-threading project. It is
also why the table is out of scope: the table body reads `sortedCourses`, `hiddenCols`, `sort`,
`getStatusClassName`, `hasActiveFilters`, and `clearFilters` - six wires into the wall.

**How it works:**

```typescript
// A component reading only its props can be lifted out verbatim.
function FacetFilter<T extends string>({ label, options, selected, onToggle, onClear }: Props<T>) {
  const activeCount = selected.length;   // derived from a prop, not from outer state
  // ...
}
```

**Key:** before moving any component, list everything it references that is not a prop. If that
list is empty, it moves. If it is not, the list is your prop-threading work order.

---

### Step 1.1: Create the file and move the component

**CATEGORY: Orchestration** - composes UI primitives, calls the callbacks it is handed, computes
nothing.

Create `src/components/progress/FacetFilter.tsx`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
// TODO(you) 1: FacetFilter's body (currently StudentProgressView.tsx:81-165) uses
//   Badge, Button, Popover/PopoverContent/PopoverTrigger, Command-style markup,
//   the `cn` helper, and at least one lucide icon. Do NOT guess this list - read
//   lines 81-165 and copy exactly the imports it actually uses. An import you add
//   speculatively is a lint error (`--max-warnings 0`), and one you miss is a
//   typecheck error. Both are fast to find; guessing is not faster than reading.

// ── 2. DATA ─────────────────────────────────────────────────
// TODO(you) 2: FacetOption<T> currently lives at StudentProgressView.tsx:62-66.
//   Move it here.
//
//   Decide before you type: should it be `export`ed, or stay module-private?
//   Go look at how StudentProgressView builds `statusOptions` (line 456) and
//   `levelOptions` (line 464) and ask whether those annotations still compile if
//   the type is private to this file. Your answer determines the modifier.

// ── 3. ORCHESTRATION ────────────────────────────────────────
// TODO(you) 3: move FacetFilter (StudentProgressView.tsx:68-165) here verbatim
//   and export it.
//
//   Verbatim is the instruction, and it is harder to follow than it sounds. You
//   will be tempted to tidy something on the way past - rename `activeCount`,
//   collapse a ternary, reformat the JSX. Do not. A refactor commit where every
//   moved line is byte-identical is one a reviewer can verify in seconds; one
//   with three drive-by improvements is one they have to read in full. Save the
//   tidying for its own commit.
//
//   The generic parameter <T extends string> travels with it. If you drop it,
//   the two call sites (lines 568 and 580) will still compile via inference in
//   some cases - which is worse than failing, because the Level facet would
//   silently widen to string. Predict what breaks before you check.
```

Then in `src/components/progress/StudentProgressView.tsx`:

```typescript
// TODO(you) 4: delete lines 62-165 (FacetOption + FacetFilter) and add the import.
//   Where does the import go? Look at the existing import block (lines 3-59) and
//   match its ordering convention rather than appending to the end.
```

**Verify:** `bunx tsc --noEmit` exits 0, and
`grep -c "" src/components/progress/StudentProgressView.tsx` returns roughly `645`.

---

### Step 1.2: Work Through It

**TODO 1:** the import list.

**Conceptual Process:**

1. Read lines 81-165. Every capitalised JSX tag and every bare function call is a dependency.
2. Cross-reference against the import block at lines 3-59 to find where each currently comes from.
3. Resist copying the whole import block. Most of it belongs to the table, not to this component.

**Why this approach?** The imports a component needs are a precise statement of its dependencies.
Copying the parent's full list would make `FacetFilter` *look* coupled to things it never touches,
and the linter will tell you so immediately.

**TODO 2:** export or not.

**Conceptual Process:**

1. `FacetOption<T>` appears in `FacetFilter`'s own props type - that use is internal.
2. It also appears in `StudentProgressView` at lines 456 and 464, as an explicit annotation on
   `statusOptions` and `levelOptions`.
3. A type used in another module's annotations has to be reachable from that module. Which
   modifier makes that true?

**Why this approach?** The type and its consumer belong together: `FacetOption` exists only to
describe what `FacetFilter` accepts. Leaving it behind in `StudentProgressView` would invert the
dependency - the trunk would own a type the leaf needs, and the leaf would import upward.

**TODO 3 and 4:** the move.

**Conceptual Process:**

1. Cut, do not retype. Retyping introduces differences you did not intend to make.
2. Add `export` to the function. That is the one intentional change.
3. Delete the original *completely* - including `FacetOption`. Leaving a now-unused type behind
   trips `--max-warnings 0`.
4. Run the suite before you look at anything else.

**Why this approach?** Making exactly one intentional change per move (adding `export`) means any
test failure has exactly one candidate cause.

---

### Step 1.3: Quiz Yourself

1. The test suite never imports `FacetFilter`. Explain why it can nonetheless catch a mistake you
   make while moving it, and name a specific mistake it would catch.
2. `FacetFilter` is generic over `<T extends string>`. What concretely goes wrong at line 571
   (`selected={selectedStatuses}`, a `CourseStatus[]`) if you drop the constraint to plain `<T>`?
3. Is `FacetFilter` a Calculation? It takes inputs and returns JSX with no I/O. Argue both sides,
   then commit to one using the definition of an Action.
4. Predict the new line count of `StudentProgressView.tsx` after this phase, then check with
   `wc -l`. If you are more than five off, what did you forget to delete?

---

### ✅ Solution

`src/components/progress/FacetFilter.tsx` (new file):

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 2. DATA ─────────────────────────────────────────────────
export interface FacetOption<T> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ── 3. ORCHESTRATION ────────────────────────────────────────
export function FacetFilter<T extends string>({   // in: props → out: JSX
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const activeCount = selected.length;            // → number
  // ...body moved verbatim from StudentProgressView.tsx:81-165...
}
```

> The exact import list depends on what lines 81-165 reference in your checkout. The one above is
> the shape to expect; let `bunx tsc --noEmit` and `bun run lint` settle the details rather than
> trusting this list blind. That is not a cop-out - it is the workflow. The compiler knows the
> answer and answers in under two seconds.

In `src/components/progress/StudentProgressView.tsx`, lines 62-165 are deleted and one import
joins the block:

```typescript
import { FacetFilter, type FacetOption } from "./FacetFilter";
```

**Why this works:** `FacetFilter` never read anything from `StudentProgressView`'s scope, so
lifting it out changes nothing at runtime - the same function receives the same props from the
same two call sites and returns the same tree. `FacetOption` is exported because lines 456 and 464
annotate with it; without `export` those two lines stop compiling, which is the compiler correctly
reporting an inverted dependency.

**Why split it this way?**

- **`FacetFilter` is Orchestration** - it composes `Popover`, `Button`, and `Badge` and invokes
  callbacks it was handed. It computes nothing (`activeCount` is `selected.length`, not a
  decision) and touches nothing outside itself. It was extracted for extract-or-inline reason 4:
  it mixes levels of abstraction with its host. `StudentProgressView` is about "this learner's
  progress"; `FacetFilter` is about "a dropdown with checkable options". Those are different
  altitudes, and 98 lines of the second was burying the first.
- **`FacetOption` moved with it** - a type exists to describe a contract, and this one describes
  `FacetFilter`'s. Types live with the thing they describe, or the dependency arrow points the
  wrong way.
- **Deliberately NOT extracted:** `activeCount`. It is `selected.length`, used twice, and a
  `countActive(selected)` helper would add a name that says less than the expression. This is the
  "single obvious expression" case from the extract-or-inline test - over-extraction fragments
  reading flow as badly as under-extraction buries it.

---

### Step 1.4: Run It

```bash
bunx tsc --noEmit && bun run lint && bunx vitest run src/components/progress
```

**Expected Output:**

```text
 Test Files  2 passed (2)
      Tests  12 passed (12)
```

Then confirm the file actually shrank:

```bash
wc -l src/components/progress/StudentProgressView.tsx
```

**Expected:** roughly `645` (749 minus the 104 lines of `FacetOption` + `FacetFilter`, plus one
import line).

**If it fails:**

- `Cannot find name 'FacetOption'` at line 456 or 464 → you moved the type but did not export it,
  or did not import it back. Both call sites annotate with it.
- `'X' is declared but its value is never read` → a leftover import in `StudentProgressView` that
  only `FacetFilter` used. Lint runs with `--max-warnings 0`, so this fails the build.
- A test fails on the Status or Level facet → you changed something while moving. `git diff` the
  new file against the deleted lines; the body should be byte-identical.

> **Work order:** one component per commit, suite green between each. A move you have verified is
> a fixed point you can trust while debugging the next one.

---

### ✅ Phase 1 Complete

You've learned:

- How to check whether a component can move before trying to move it: list everything it
  references that is not a prop.
- Why a type moves with the component whose contract it describes.
- Why "verbatim" is a real constraint and drive-by tidying makes a refactor unreviewable.

**Next:** Phase 2 - the same move twice more, plus one type leak worth fixing.

---

## Phase 2: Extract SortHeader and ColumnToggle

**Concepts:** repeating a proven pattern, narrowing a prop type that is wider than its value

### Concept: a prop type wider than the value it receives

**Picture it first:** a camera mount rated for any lens up to 20kg, bolted to a rig that only ever
holds a 2kg prime. The rating is not wrong, but it tells the next person to expect loads that will
in fact never arrive - and it silently permits someone to hang a 20kg lens on a rig that cannot
take it.

**What is it?** `SortHeader`'s `sort` prop (line 175) is typed:

```typescript
sort: { col: string | null; dir: "asc" | "desc" };
```

But the only value ever passed is the state declared at line 267:

```typescript
const [sort, setSort] = useState<{ col: SortCol | null; dir: "asc" | "desc" }>({ ... });
```

`SortCol` (`courseTable.ts:7`) is `"courseId" | "courseName" | "program" | "level" | "status"` -
five strings. The prop accepts all strings. Line 179 then does `sort.col === col`, comparing a
`string | null` against a `SortCol`, which TypeScript permits and which will happily be `false`
forever if someone passes a typo.

**Why?** Because this is the cheapest moment to fix it. The type is being retyped into a new file
either way, and narrowing it costs one word. Note this is a *type-level* change with no runtime
effect - which is the only kind of change that belongs in a refactor commit. It cannot alter
behaviour; it can only reject a program that was already wrong.

**How it works:**

```typescript
// Before: accepts any string.  After: accepts only a real sort column.
sort: { col: SortCol | null; dir: "asc" | "desc" };
```

**Key:** when a prop type is wider than every value that reaches it, narrowing it is free safety.
When it is *narrower*, you have a bug already.

---

### Step 2.1: Extract both components

**CATEGORY: Orchestration** - both compose UI primitives and call handed-in callbacks.

Create `src/components/progress/SortHeader.tsx`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
// TODO(you) 5: read StudentProgressView.tsx:180-214 and import exactly what the
//   body uses. It is a DropdownMenu plus sort/hide icons and a type from
//   ./courseTable. Same discipline as Phase 1: read, do not guess.

// ── 2. ORCHESTRATION ────────────────────────────────────────
// TODO(you) 6: move SortHeader (lines 166-214) here and export it.
//
//   One intentional change while you move: narrow the `sort` prop's `col` from
//   `string | null` to the type the value actually has. You have SortCol
//   imported already for the `col` prop on line 173.
//
//   Before you make it, predict: does this change break either call site? All
//   five are lines 614-667 and every one passes the same `sort` state object.
//   Reason it out from the state's declared type at line 267, then let tsc
//   confirm. Getting used to predicting-then-checking is the point of this step.
```

Create `src/components/progress/ColumnToggle.tsx`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
// TODO(you) 7: read StudentProgressView.tsx:222-248. This one also needs COLUMNS
//   and ColKey from ./courseTable - note it iterates COLUMNS (line 236) rather
//   than taking the column list as a prop.

// ── 2. ORCHESTRATION ────────────────────────────────────────
// TODO(you) 8: move ColumnToggle (lines 215-248) here and export it.
//
//   A design question worth answering even though the answer here is "leave it":
//   this component imports COLUMNS directly rather than receiving it as a prop,
//   which makes it hard-wired to one specific table. Is that a problem? Argue it
//   from how many tables exist in this repo today, then leave the code alone.
//   Knowing why you are NOT generalising is worth as much as generalising.
```

Then in `StudentProgressView.tsx`:

```typescript
// TODO(you) 9: delete lines 166-248 (both components) and add two imports.
```

**Verify:** `grep -n "^function SortHeader\|^function ColumnToggle"
src/components/progress/StudentProgressView.tsx` returns no matches.

---

### Step 2.2: Work Through It

**TODO 6:** the narrowing.

**Conceptual Process:**

1. Write down what `sort` is at line 267 and what the prop claims at line 175. Note the gap.
2. Ask what line 179 (`sort.col === col`) does under each type. Under the wide type, is there any
   comparison the compiler would reject? Should there be?
3. Make the change, then predict tsc's output *before* running it. Five call sites pass the same
   object; if your prediction is "no errors", say why.

**Why this approach?** A type-only change in a refactor commit is safe precisely because it cannot
alter runtime behaviour - it can only reject programs that were already wrong. Predicting the
compiler's answer before asking is how you build the instinct to know when a change is safe
without running anything.

**TODO 8:** the COLUMNS question.

**Conceptual Process:**

1. Count the tables in this repo that need a column toggle. (`grep -rn "COLUMNS" src/`.)
2. Recall the extract-or-inline rule about DRY: extract on the *second real* use, not on
   speculation. Does the same logic apply to parameterising?
3. Leave it. Note in your commit body that it is deliberate.

**Why this approach?** Making `ColumnToggle` take its column list as a prop would be strictly more
flexible and strictly worse today: one more prop to thread at the single call site, to serve a
second table that does not exist. YAGNI is not laziness here - the generalised version is harder
to read for zero present benefit, and the day a second table appears the change is five minutes.

---

### Step 2.3: Quiz Yourself

1. You narrowed `sort.col` to `SortCol | null` and tsc still exits 0. What does that prove about
   the five call sites, and what does it *not* prove about the component's behaviour?
2. `ColumnToggle` imports `COLUMNS` rather than receiving it. Name the one concrete change that
   would force you to parameterise it, and say why that change has not happened yet.
3. All three extracted components take callbacks (`onToggle`, `onSort`, `onHide`, `onClear`) but
   none owns state. Which category does that make them, and which component still owns all the
   state?
4. Predict: after this phase, how many lines remain in `StudentProgressView.tsx`? Which single
   remaining component accounts for most of them?

---

### ✅ Solution

`src/components/progress/SortHeader.tsx`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUp, ArrowDown, ArrowUpDown, EyeOff } from "lucide-react";
import type { SortCol } from "./courseTable";

// ── 2. ORCHESTRATION ────────────────────────────────────────
export function SortHeader({                          // in: props → out: JSX
  col,
  label,
  sort,
  onSort,
  onHide,
}: {
  col: SortCol;
  label: string;
  sort: { col: SortCol | null; dir: "asc" | "desc" };  // narrowed from string | null
  onSort: (col: SortCol, dir: "asc" | "desc") => void;
  onHide: () => void;
}) {
  const isActive = sort.col === col;                   // → boolean
  // ...body moved verbatim from StudentProgressView.tsx:180-214...
}
```

`src/components/progress/ColumnToggle.tsx`:

```typescript
// ── 1. IMPORTS ──────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";
import { COLUMNS, type ColKey } from "./courseTable";

// ── 2. ORCHESTRATION ────────────────────────────────────────
export function ColumnToggle({                        // in: props → out: JSX
  hiddenCols,
  onToggle,
}: {
  hiddenCols: Set<ColKey>;
  onToggle: (col: ColKey) => void;
}) {
  // ...body moved verbatim from StudentProgressView.tsx:222-248...
}
```

And in `StudentProgressView.tsx`, lines 166-248 are gone, replaced by:

```typescript
import { SortHeader } from "./SortHeader";
import { ColumnToggle } from "./ColumnToggle";
```

**Why this works:** both components already received everything through props, so relocating them
is a no-op at runtime. The narrowing on `sort.col` compiles because all five call sites (lines
614-667) pass the same state object, which was declared as `SortCol | null` at line 267 all along -
the prop type was simply looser than reality. Nothing at runtime changed; a class of future
mistake became unrepresentable.

**Why split it this way?**

- **Both are Orchestration** - they compose primitives and invoke callbacks, computing nothing.
  The extract-or-inline reason is again #4, mixing levels of abstraction, and additionally #3 for
  `SortHeader`: it has five call sites (lines 614, 625, 636, 647, 662), which is as real as "it
  appears more than once" gets.
- **`SortHeader` and `ColumnToggle` got separate files rather than one `TableChrome.tsx`** - they
  share a category, not a responsibility. Bundling them would mean a file whose name has to be
  vague, and vague file names are how 749-line files start.
- **`ColumnToggle` keeps importing `COLUMNS` directly** - deliberately not parameterised. One
  table exists. Adding a prop to serve a hypothetical second one would be extraction on
  speculation, which the extract-or-inline test explicitly rules out (reason 3 requires the second
  use to be *real*).
- **The narrowing is the only non-verbatim change in this phase, and it is type-level.** That is
  the one category of edit safe to smuggle into a refactor, because the compiler proves it has no
  runtime effect.

---

### Step 2.4: Run It

```bash
bunx tsc --noEmit && bun run lint && bunx vitest run && \
  wc -l src/components/progress/StudentProgressView.tsx
```

**Expected Output:**

```text
 Test Files  4 passed (4)
      Tests  56 passed (56)
     565 src/components/progress/StudentProgressView.tsx
```

Line count roughly `565` (645 minus 83 moved lines, plus two imports). Within ten lines is fine.

**If it fails:**

- `Type 'string' is not assignable to type 'SortCol'` → your narrowing found a real call site
  passing something wider. Do not widen the type back; look at what that site passes.
- Sort tests fail (`sorts by level ascending and descending`) → the `isActive` comparison or an
  icon branch changed while moving. Diff the moved body against the deleted lines.
- Column-hiding test fails → `ColumnToggle` is iterating a different `COLUMNS` than the table
  header does. Both must come from `./courseTable`.

---

### ✅ Phase 2 Complete

You've learned:

- That repeating a proven extraction is mechanical, and that the second and third are where you
  bank the confidence for the risky one.
- How to spot a prop type wider than every value that reaches it, and why narrowing it is safe
  inside a refactor when nothing else is.
- Why declining to generalise is a decision worth recording.

**Next:** Phase 3 - the only phase that changes when code runs.

---

## Phase 3: Stop syncing metrics through an effect

**Concepts:** derived state vs. synced state, calculations trapped in actions, the preference rule

### Concept: the calculation hiding inside an action

**Picture it first:** a colourist grades a shot, then walks the drive down the hall so the editor
can drop it in. Every time the edit changes, that walk happens again, and for the length of the
walk the cutting room is holding a version that does not match what the colourist has. Now imagine
the grade is instant and deterministic - the walk is pure overhead, and the only thing it adds is
a window where the two rooms disagree.

**What is it?** Lines 396-419 are that walk. The effect computes six numbers from `flatCourses`
and calls `setMetrics`, which schedules a second render. Every number is a pure function of state
already in hand - counts, a ratio, a `Set` size. Nothing is fetched. Nothing is timed.

**Why?** Two concrete costs, and one of them is a real (if small) bug:

1. **An extra render per change.** Type one character in the search box: render 1 runs the effect,
   `setMetrics` schedules render 2. Every keystroke costs two renders instead of one.
2. **A window where the tiles disagree with the table.** During render 1 the table below already
   reflects the new search text (it is derived at line 422, during render), while `metrics` still
   holds the previous values. It is one frame, and users will rarely catch it - but it is a state
   the UI can be in that is not describable as a function of its inputs, which is exactly the
   class of bug that gets hard later.

The `filteredCourses` at line 422 is already correct, and its comment says so: *"filteredCourses
is 'derived state' computed from other state on every render"*. Phase 3 makes `metrics` match its
neighbour.

**How it works:**

```typescript
// Synced (before): state + an effect that writes it.
const [metrics, setMetrics] = useState<StudentMetrics>({ ...zeros });
useEffect(() => { setMetrics(compute(flatCourses)); }, [flatCourses, ...]);

// Derived (after): computed during render, no state, no effect.
const metrics = useMemo(() => compute(flatCourses), [flatCourses, ...]);
```

**Key:** if you can compute it during render from things you already have, storing it in state is
strictly worse. `useEffect` is for synchronising with something *outside* React - not for keeping
one piece of React state in step with another.

---

### Step 3.1: Replace the effect with a derived value

**CATEGORY: Calculation replacing an Action.** This is the preference rule applied directly.

In `src/components/progress/StudentProgressView.tsx`:

```typescript
// TODO(you) 10: the metrics computation currently lives in an effect (396-419)
//   and its result in state (258-265). Replace both with one derived value.
//
//   Three decisions, in order:
//
//   (a) Where does the computing code go? You have an exemplar sitting next door:
//       courseTable.ts holds the pure rules for this table and its header comment
//       explains why. Six counts over CourseRow[] are the same kind of thing. Does
//       this belong there as an exported calculation, or inline in the component?
//       Argue it from testability - courseTable.test.ts already exists.
//
//   (b) The guard on line 397 is `if (flatCourses.length === 0) return;` - it bails
//       BEFORE setMetrics, leaving the zeroed initial state in place. Your derived
//       version has no initial state to fall back on. What does
//       `completionPercentage` (line 411) evaluate to when flatCourses is empty?
//       Work out 0/0 in JavaScript before you write the guard, and make sure the
//       metric tiles never render that value.
//
//   (c) `programsAssigned` (line 415) counts distinct programs in *filteredCourses*
//       while the other five count over *flatCourses*. That asymmetry is
//       deliberate - there is a test named "feeds the Programs Assigned metric from
//       the same filter as the table" (test file line 187) that pins it. Preserve
//       it exactly. If you unify them "for consistency" that test will fail, and it
//       will be right and you will be wrong.

// TODO(you) 11: delete the now-dead pieces. The useState at 258-265 goes; check
//   whether `useEffect` is still imported and used elsewhere in the file before
//   removing it from the import on line 39. (It is - there is a fetch effect at
//   line 279. Verify rather than assume.)
```

**Verify:** `grep -n "setMetrics" src/components/progress/StudentProgressView.tsx` returns no
matches, and `bunx vitest run src/components/progress` still passes 12.

---

### Step 3.2: Work Through It

**TODO 10(a):** where the computation lives.

**Conceptual Process:**

1. `courseTable.ts` opens with `// CALCULATIONS: pure filter/sort/column rules behind the student
   progress table.` Do six counts over `CourseRow[]` fit that sentence?
2. There is already a `courseTable.test.ts`. What does moving the computation there let you test
   that you cannot test while it sits inside a component?
3. The counter-argument: it is used once, so extraction reason 3 (appears twice) does not apply.
   Does reason 1 (a calculation hiding inside an action) apply? Does reason 2 (you would have to
   comment it)?

**Why this approach?** The strongest argument for moving it is not tidiness - it is that
`completionPercentage` has a division that can produce `NaN`, and a pure function is where you can
pin that with a one-line test. Logic with an edge case wants to be somewhere a test can reach it
without rendering a component and mocking two API modules.

**TODO 10(b):** the empty guard.

**Conceptual Process:**

1. In JavaScript, `0 / 0` is `NaN`. `NaN` rendered into JSX shows the literal text `NaN`.
2. The old code dodged this by returning early, leaving `useState`'s zeroed initial value in
   place. Your derived version computes on every render, including the first.
3. So the guard has to live inside the computation and produce the same zeroed shape the initial
   state used to provide. Where exactly?

**Why this approach?** This is the one place in Phase 3 where "move the code" is not enough. The
early-return-plus-initial-state pattern only works when there *is* stored state; deriving means
the function must be total - defined for every input, including the empty array.

**TODO 10(c):** preserve the asymmetry.

**Conceptual Process:**

1. Read the test at line 187 of the test file and note what it asserts.
2. Note that five metrics describe "this learner's whole assignment" and one describes "what you
   are currently looking at". They answer different questions, so they read different arrays.
3. Copy the asymmetry across exactly. Add a comment saying it is intentional, because the next
   reader will think it is a bug.

**Why this approach?** A refactor that "fixes" an inconsistency the tests pin is not a refactor -
it is an unreviewed behaviour change wearing a refactor's commit message. The test exists because
someone already decided this.

---

### Step 3.3: Quiz Yourself

1. The effect's dependency array (line 419) is `[flatCourses, selectedLevels, selectedStatuses,
   searchText]`. Your `useMemo` needs a dependency array too. Are they the same list? Justify each
   entry by naming which metric depends on it.
2. Why is `useMemo` the right tool here rather than just computing the value inline with no memo
   at all? What would the cost be at `n = 5` courses, and would you make the same call at
   `n = 5000`?
3. The old code rendered twice per keystroke. Describe the exact state of the UI between those two
   renders, and say which specific metric tile could visibly disagree with the table.
4. `if (flatCourses.length === 0) return;` protected against `NaN` by accident, not by design.
   Explain the mechanism, and say why the derived version cannot use the same trick.

---

### ✅ Solution

Added to `src/components/progress/courseTable.ts` (the exemplar file gains one more calculation):

```typescript
// ── CALCULATION ─────────────────────────────────────────────

/**
 * The six progress metrics for one learner.
 *
 * Five of them describe the learner's whole assignment and read `rows`.
 * `programsAssigned` deliberately reads `filtered` instead, so the tile tracks
 * what the table is currently showing. That asymmetry is intentional and pinned
 * by a test - do not "unify" it.
 */
export function computeMetrics(
  rows: CourseRow[],                                   // in: CourseRow[]
  filtered: CourseRow[],                               // in: CourseRow[]
): StudentMetrics {                                    // out: StudentMetrics
  const completed = rows.filter((r) => r.status === "Completed").length;   // → number

  return {
    statusCompleted: completed,                                            // → number
    statusIncomplete: rows.filter((r) => r.status === "Incomplete").length,
    statusNotEnrolled: rows.filter((r) => r.status === "Not Enrolled").length,
    totalCourses: rows.length,                                             // → number
    // Guard the division: 0/0 is NaN, and NaN renders as the text "NaN".
    completionPercentage: rows.length === 0 ? 0 : (completed / rows.length) * 100,
    programsAssigned: new Set(filtered.map((r) => r.program.id)).size,      // → number
  };
}
```

This needs `StudentMetrics` added to the existing type import at `courseTable.ts:5`.

In `src/components/progress/StudentProgressView.tsx` - the `useState` at 258-265 and the entire
effect at 396-419 are deleted, and `metrics` becomes derived, placed just after `filteredCourses`
so it reads in dependency order:

```typescript
// filteredCourses is 'derived state' computed from other state on every render
const filteredCourses = filterCourses(flatCourses, {   // → CourseRow[]
  levels: selectedLevels,
  statuses: selectedStatuses,
  search: searchText,
});

const metrics = useMemo(                               // → StudentMetrics
  () => computeMetrics(flatCourses, filteredCourses),
  [flatCourses, filteredCourses],
);
```

And the import at line 52 gains `computeMetrics`.

**Why this works:** `computeMetrics` is total - it returns a valid `StudentMetrics` for every
input including `[]`, so there is no initial state to fall back on and none is needed. The
explicit `rows.length === 0 ? 0 : ...` replaces the accidental protection the early return used to
provide. Because `metrics` is now computed during render from the same inputs the table uses, the
tiles and the table can no longer disagree: they are two readings of one render's data rather than
two pieces of state chasing each other.

The dependency array shrinks from four entries to two, and that is not a shortcut -
`selectedLevels`, `selectedStatuses`, and `searchText` only ever reached the metrics *through*
`filterCourses`, so depending on `filteredCourses` covers all three transitively.

**Why split it this way?**

- **`computeMetrics` is a Calculation, and it went to `courseTable.ts`** - extract-or-inline reason
  1, the big one: a calculation hiding inside an action. The action was `useEffect` +
  `setMetrics`. What got easier is concrete: the `NaN` edge case is now one line in
  `courseTable.test.ts` instead of a component render with two mocked API modules.
- **It takes `rows` and `filtered` as two parameters** rather than taking the filters and
  re-filtering internally. Re-filtering inside would duplicate work the component has already
  done at line 422 and would re-introduce exactly the two-copies-of-one-predicate problem that
  `courseTable.ts` was created to solve.
- **`metrics` is a `useMemo`, not a bare expression** - the memo is cheap insurance rather than a
  measured win at five rows. The honest reasoning is in Alternate Solution 1 below; a bare `const`
  would also be correct here.
- **The preference rule, concretely:** six numbers moved from being produced by an Action (an
  effect with a side effect) to being produced by a Calculation (a pure function called during
  render). One `useState` and one `useEffect` disappeared. That is the rule paying rent, not just
  labelling.

---

### Step 3.4: Run It

```bash
bunx tsc --noEmit && bun run lint && bunx vitest run && \
  wc -l src/components/progress/StudentProgressView.tsx
```

**Expected Output:**

```text
 Test Files  4 passed (4)
      Tests  56 passed (56)
     520 src/components/progress/StudentProgressView.tsx
```

Then look at it running:

```bash
bun dev
```

**Expected:** pick a student from the supervisor roster. The five metric tiles show the same
numbers as before, and typing in the filter box updates "Programs Assigned" while the other four
tiles hold steady. That last part is the asymmetry from TODO 10(c) working as designed.

**If it fails:**

- The test `feeds the Programs Assigned metric from the same filter as the table` fails → you
  passed `flatCourses` where `filtered` was wanted, or unified the two.
- A tile shows `NaN` → the empty-array guard is missing or placed after the division.
- `React Hook useMemo has a missing dependency` from lint → add what it names; do not silence the
  rule.
- Metrics are all zero → you are computing over `filteredCourses` for all six instead of five over
  `flatCourses`.

---

### ✅ Phase 3 Complete

You've learned:

- How to tell derived state from synced state, and why an effect that only writes React state from
  React state is nearly always the wrong tool.
- That making a function total is the price of dropping the `useState` that used to supply a
  fallback.
- That an inconsistency pinned by a test is a decision, not a defect.

---

## Test plan

This refactor's correctness claim is "behaviour is unchanged", so the test plan is mostly the
existing suite - run unedited. Writing new tests for the moved components would be beside the
point here; the one genuinely new piece of logic is `computeMetrics`, and covering its `NaN` edge
is Stretch Goal 2.

1. **Setup.** `bun install` (if `ls node_modules/motion` fails). Then, **before any edit**, run
   `bunx vitest run` and confirm `Tests 56 passed (56)`. A refactor with no known-good starting
   point is not a refactor.
2. **After each phase** - the suite, unedited:

    ```bash
    bunx vitest run
    ```

    → `Tests 56 passed (56)`, every time, all three phases. **The number must not change, and
    neither may the test file.** `git status` must never show
    `src/components/progress/__tests__/StudentProgressView.test.tsx` as modified. If it does, you
    have changed behaviour and are editing the instrument to match.
3. **The file actually shrank:**

    ```bash
    wc -l src/components/progress/StudentProgressView.tsx
    ```

    → roughly `520`, down from `749`. **Before this change it was 749** - that delta, together
    with a green suite, is the whole claim of this ticket.
4. **Nothing leaked upward** - the three new components must not import from the trunk:

    ```bash
    grep -n "StudentProgressView" src/components/progress/FacetFilter.tsx \
      src/components/progress/SortHeader.tsx src/components/progress/ColumnToggle.tsx
    ```

    → no output. Any match is a dependency cycle.
5. **Visual check** - `bun dev`, open a student's progress view, and exercise each extracted
   piece: toggle a Status facet, toggle a Level facet, click a column header to sort both
   directions, hide and re-show a column, type in the search box. All five must behave exactly as
   they did before. The suite covers all of these, so this is confirmation rather than discovery.
6. **Teardown.** Stop `bun dev`. `git status` shows three new files and two modified
   (`StudentProgressView.tsx`, `courseTable.ts`), and nothing else.

---

## Done criteria

Machine-checkable. ALL must hold. Tick these as you go - an unticked box in **Per phase** means go
back to that phase; an unticked box in **Final gates** means the work is done but not yet clean.

**Per phase**

- [ ] Phase 1 - `src/components/progress/FacetFilter.tsx` exists and
      `grep -c "" src/components/progress/StudentProgressView.tsx` is under `660`
- [ ] Phase 1 - `bunx vitest run src/components/progress` → `Tests 12 passed (12)`
- [ ] Phase 2 - `grep -n "^function SortHeader\|^function ColumnToggle"
  src/components/progress/StudentProgressView.tsx`
      returns no matches
- [ ] Phase 2 - `grep -n "col: string | null" src/components/progress/SortHeader.tsx` returns no
      matches (the narrowing landed)
- [ ] Phase 3 - `grep -n "setMetrics\|useState<StudentMetrics>"
  src/components/progress/StudentProgressView.tsx`
      returns no matches
- [ ] Phase 3 - `grep -n "computeMetrics" src/components/progress/courseTable.ts` returns a match
- [ ] Test plan step 3 - `wc -l src/components/progress/StudentProgressView.tsx` is under `560`
- [ ] Test plan step 4 - the three new files contain no reference to `StudentProgressView`

**Final gates**

- [ ] `bunx tsc --noEmit` exits 0
- [ ] `bun run lint` exits 0 with no new warnings
- [ ] `bunx vitest run` → `Tests 56 passed (56)` (unchanged from before the refactor)
- [ ] `bun run build` exits 0
- [ ] `git status` does NOT list
      `src/components/progress/__tests__/StudentProgressView.test.tsx` as modified
- [ ] No files outside `src/components/progress/` are modified (`git status`)
- [ ] Three separate commits, one per phase

---

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" do not match the live code (drift since `8b1c686`). The Linear
  ticket's figures were stale before it was rewritten - it said 809 lines and claimed a duplicated filter
  predicate that `courseTable.ts` has since eliminated. If your line numbers differ from this
  document's too, something landed after it was written.
- **A test fails and the obvious fix is to edit the test.** This is the most important stop
  condition in this document. The suite is the only evidence that a behaviour-preserving refactor
  preserved behaviour; editing it to match your change destroys the evidence and the change at
  once. Revert to the last green commit and diff.
- Extracting a component requires it to import anything from `StudentProgressView.tsx`. That is a
  cycle, and it means the component is not as decoupled as it looked - a different seam is needed.
- Ticket ETH-38 has landed and changed `getCourseStatus` (line 359) or the `CourseRow.status`
  values. Your refactor is still correct, but re-run the full suite and note the interaction for
  the reviewer.
- The line count after all three phases is above 600. Something did not get deleted - most likely
  an inline definition was copied rather than moved.

---

## Maintenance notes

- **The table is still inline**, roughly 300 lines of it, and it is the largest single thing left
  in the file. That is deliberate (see Scope) and it is the natural next ticket. Do not treat this
  ticket as having failed because the file is 520 lines rather than 200.
- **`getCourseStatus` (line 359) can never return `"Completed"`.** After this refactor it is still
  wrong, in the same way, at roughly the same place. That is Ticket ETH-38's fix. A reviewer
  seeing `statusCompleted: 0` in the UI should not read it as a regression from this change.
- **`computeMetrics` now owns the `NaN` guard.** If someone later removes the
  `rows.length === 0 ? 0 :` branch because "it can't be empty", the metric tiles will render the
  text `NaN` on first paint. Leave it.
- **A reviewer should confirm** the three moved bodies are byte-identical to the deleted ones:
  `git show HEAD~2 -- src/components/progress/StudentProgressView.tsx` against the new files. Any
  difference is either a bug or an unreviewed improvement, and both want to be called out.
- **Deliberately deferred:** `ColumnToggle` is hard-wired to `COLUMNS` from `courseTable.ts`. Fine
  for one table; the day a second one needs it, make the column list a prop.
- **Deliberately deferred:** this plan does not add tests for the three extracted components. They
  are presentational and fully covered through the parent's suite; testing them in isolation would
  mostly assert that Radix renders.

---

## What You Should Know Now

**You can now do, unaided:**

- Decide whether a component can be extracted by listing everything it references that is not a
  prop, before writing any code.
- Run a refactor as a sequence of provably-neutral moves, each verified by an unedited test suite,
  and know which commit to blame when one goes red.
- Tell derived state from synced state, and convert a `useState` + `useEffect` pair into a value
  computed during render - including making the computation total so it no longer needs an initial
  value.
- Recognise a prop type wider than every value that reaches it, and know that a type-only
  narrowing is one of the few edits safe to include in a refactor commit.

**Now true about this codebase:**

- `src/components/progress/courseTable.ts` is where pure table logic lives, and its header comment
  states the rule. New calculations about the course table go there, not into the component.
- The predicate duplication the ETH-40 ticket describes was already fixed; `matchesFilters`
  (`courseTable.ts:59`) is the single filter rule and both passes call it.
- `programsAssigned` intentionally reads the *filtered* rows while the other five metrics read all
  rows, and a test at line 187 of the suite pins that asymmetry.
- `StudentProgressView.test.tsx` mocks `@/api/legacyRoutes` and `@/api/localRoutes` and stubs
  `ResizeObserver` for Radix - which is why it can render the whole component offline, and why it
  is a usable safety net on a train.
- The `motion` package must be installed (`bun install`) or this component's suite cannot load at
  all.

**Check yourself:**

1. A teammate opens a PR that extracts the table into `CourseTable.tsx` and edits four assertions
   in `StudentProgressView.test.tsx` to make the suite pass. What is your review comment, and what
   do you ask them to do instead?
2. You find another component with a `useEffect` whose entire body is `setSomething(f(state))`.
   What is your first question, and what would have to be true for the effect to be justified?
3. Why was Phase 3 sequenced last rather than first, given it is the phase with the clearest
   payoff?

---

## Stretch Goals

**Extract the table itself** - the deliberate out-of-scope item, and now the largest thing left in
the file at roughly 300 lines. With the three easy extractions merged and green, the risky one has
a much better safety net than it did at 749 lines.

> Copy this prompt to get a tutorial for it:
> `In the phillips-poc-public repo, src/components/progress/StudentProgressView.tsx still renders
> its course table inline (the Table element through the closing TableBody, roughly 300 lines) after
> FacetFilter, SortHeader, and ColumnToggle were extracted to their own files. The table body reads
> sortedCourses, hiddenCols, sort, setSort, toggleCol, hasActiveFilters, clearFilters, and a local
> getStatusClassName helper, so unlike the other three it cannot move without threading props or
> introducing a context. Create a tutorial that extracts it into
> src/components/progress/CourseTable.tsx, decides deliberately between a wide props interface and a
> small context, and keeps all 56 tests passing without editing
> src/components/progress/__tests__/StudentProgressView.test.tsx. Include a phase on where
> getStatusClassName should live.`

**Unit-test `computeMetrics`** - it now owns a division that returns `NaN` on an empty array, and
an asymmetry (five metrics over all rows, one over filtered rows) that a future reader will
mistake for a bug. Both are currently protected only by a component-level test that mocks two API
modules.

> Copy this prompt to get a tutorial for it:
> `In the phillips-poc-public repo, src/components/progress/courseTable.ts exports
> computeMetrics(rows: CourseRow[], filtered: CourseRow[]): StudentMetrics, which guards a
> completionPercentage division against an empty rows array and deliberately computes
> programsAssigned from the filtered parameter while the other five metrics use the rows parameter.
> There are existing pure-function tests in src/components/progress/__tests__/courseTable.test.ts to
> copy the style from. Create a tutorial that adds cases for: an empty rows array returning 0 rather
> than NaN, a mix of all three CourseStatus values, programsAssigned differing from the unfiltered
> program count, and rows spanning duplicate program ids. Explain why the rows-versus-filtered
> asymmetry is intentional.`

**Delete `ProgramProgressCard.old.tsx`** - verified orphaned: nothing outside the file imports it.
It is 4.9K of dead code in the directory you have just spent three phases organising, and it
actively misleads - Ticket ETH-38's original draft pointed at it as an exemplar before someone
checked.

> Copy this prompt to get a tutorial for it:
> `In the phillips-poc-public repo, src/components/progress/ProgramProgressCard.old.tsx is dead code
> - a repo-wide grep shows the only references to ProgramProgressCard are inside that file itself.
> Create a short tutorial that verifies the orphan claim from scratch (including checking dynamic
> imports and string references, not just static ones), removes the file, and confirms typecheck,
> lint, build, and all 56 tests still pass. Cover how to prove a file is unreferenced rather than
> assuming it from one grep.`

---

## Advanced Techniques & Alternate Solutions

### Compute metrics with a bare `const` instead of `useMemo`

```typescript
const metrics = computeMetrics(flatCourses, filteredCourses);   // → StudentMetrics
```

**When this wins:** at this data size, honestly, now. `flatCourses` holds a handful of rows;
`computeMetrics` is four array passes and a `Set`. The `useMemo` costs a dependency array to keep
correct and saves work you cannot measure. The repo already does exactly this one line earlier -
`filteredCourses` at line 422 is a bare call with no memo. **Crossover:** memoise when the input
grows into the thousands, or when `metrics` becomes a prop to a `React.memo` child, where a fresh
object identity each render would defeat the memo. Neither is true here, so the `useMemo` in the
Solution is defensible but not required - if you wrote the bare version, you were not wrong.

### Move the three components into a `progress/table/` subdirectory

```text
src/components/progress/
  table/  FacetFilter.tsx  SortHeader.tsx  ColumnToggle.tsx  CourseTable.tsx
  StudentProgressView.tsx  courseTable.ts
```

**When this wins:** once the table extraction lands and there are four or more table-specific
components, a subdirectory stops `progress/` reading as a pile. **Crossover:** roughly five files
in a directory, or the moment two obviously different groupings exist side by side. At three files
it is premature - you would pay an import-path churn now for tidiness you cannot use yet, and the
follow-up ticket would have to move things again anyway.

### Put the shared table state in a context instead of props (worse here, better elsewhere)

```typescript
const TableContext = createContext<{ sort: CourseSort; hiddenCols: Set<ColKey> } | null>(null);
```

**Why it loses here:** all three extracted components sit exactly one level below their consumer.
Context would replace five explicit, typed, greppable props with an implicit dependency you cannot
see at the call site - and it would make each component unusable without a provider, which is a
real cost in tests. **Where it wins:** when the table gains nested sub-components three or four
levels deep and the same `sort` object is being drilled through components that do not use it.
**Crossover:** two or more levels of pass-through props that a component only forwards. Today
there are zero. Worth revisiting when the table extraction lands, because that is the change that
could create them.

### Considered and rejected

- **Doing all three extractions in one commit.** Rejected: if the suite goes red you have three
  candidate causes and one diff. Three commits cost nothing and turn a bisect into a glance.
- **Fixing `getCourseStatus` while in the file.** Rejected: it is a behaviour change, it belongs to
  ETH-38, and mixing it in would make every "is this just moved code?" review question
  unanswerable.
- **Extracting the table in the same ticket.** Rejected: it is the one piece without a clean props
  seam, and bundling the risky extraction with three safe ones means a reviewer cannot approve the
  safe part independently.
- **Renaming `FacetFilter` to `FacetDropdown`** while moving it. Rejected: a rename in a move
  commit means the diff cannot be read as a move at all. If the name is worth changing, change it
  in its own commit afterwards.

---

## Reference

### Common Patterns

#### The extraction checklist

```text
1. List everything the component references that is NOT a prop.  Empty -> movable.
2. Create the file. Move the body verbatim. Add `export`. Change nothing else.
3. Move any type that exists only to describe this component's contract.
4. Delete the original completely, including now-unused imports.
5. Typecheck, lint, run the suite. Commit before starting the next one.
```

#### Synced state to derived state

```typescript
// Before: state + effect
const [x, setX] = useState(initial);
useEffect(() => { setX(compute(a, b)); }, [a, b]);

// After: derived, and `compute` must be total (defined for every input)
const x = compute(a, b);
```

---

### Troubleshooting

**Problem:** `Cannot find name 'FacetOption'`  
**Solution:** the type moved but was not exported, or not imported back into
`StudentProgressView`. Lines 456 and 464 annotate with it.

**Problem:** `'useEffect' is declared but its value is never read`  
**Solution:** you removed the last effect. Check first - there is still a fetch effect at line
279, so this warning more likely means you deleted more than the metrics effect.

**Problem:** A metric tile renders `NaN`  
**Solution:** the empty-array guard in `computeMetrics` is missing or sits after the division.
`0 / 0` is `NaN`, and the old early return was masking it via `useState`'s initial value.

**Problem:** `feeds the Programs Assigned metric from the same filter as the table` fails  
**Solution:** `programsAssigned` must be computed from the *filtered* rows while the other five use
all rows. You unified them.

**Problem:** `Failed to resolve import "motion/react"`  
**Solution:** stale `node_modules` after commit `8b1c686`. Run `bun install`. Unrelated to your
change, but it disables your safety net until fixed.

---

### Key Takeaways

1. A component whose entire input arrives through props can move to any file; one that reads
   ambient state cannot until you give it a plug. Check before you move.
2. In a refactor, the test suite is the instrument. Editing it to make a change pass destroys the
   only evidence the change was safe.
3. `useEffect` is for synchronising with something outside React. An effect whose body is
   `setState(f(otherState))` is a calculation trapped in an action.
4. Deriving a value instead of storing it means the function must be total - the `useState`
   initial value that used to cover the empty case is gone.
5. One intentional change per move. Type-level narrowing is the rare exception, because the
   compiler proves it has no runtime effect.
6. Declining to generalise is a decision worth recording, and "there is only one of these today"
   is a complete justification.

---

### Full Reference Implementation

```typescript
// src/components/progress/FacetFilter.tsx - new file (imports depend on the moved body)
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FacetOption<T> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function FacetFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const activeCount = selected.length;   // → number
  // body moved verbatim from StudentProgressView.tsx:81-165
}
```

```typescript
// src/components/progress/SortHeader.tsx - new file
import type { SortCol } from "./courseTable";

export function SortHeader({
  col,
  label,
  sort,
  onSort,
  onHide,
}: {
  col: SortCol;
  label: string;
  sort: { col: SortCol | null; dir: "asc" | "desc" };  // narrowed from string | null
  onSort: (col: SortCol, dir: "asc" | "desc") => void;
  onHide: () => void;
}) {
  const isActive = sort.col === col;                   // → boolean
  // body moved verbatim from StudentProgressView.tsx:180-214
}
```

```typescript
// src/components/progress/ColumnToggle.tsx - new file
import { COLUMNS, type ColKey } from "./courseTable";

export function ColumnToggle({
  hiddenCols,
  onToggle,
}: {
  hiddenCols: Set<ColKey>;
  onToggle: (col: ColKey) => void;
}) {
  // body moved verbatim from StudentProgressView.tsx:222-248
}
```

```typescript
// src/components/progress/courseTable.ts - appended calculation

/**
 * The six progress metrics for one learner.
 *
 * Five of them describe the learner's whole assignment and read `rows`.
 * `programsAssigned` deliberately reads `filtered` instead, so the tile tracks
 * what the table is currently showing. That asymmetry is intentional and pinned
 * by a test - do not "unify" it.
 */
export function computeMetrics(
  rows: CourseRow[],                                   // in: CourseRow[]
  filtered: CourseRow[],                               // in: CourseRow[]
): StudentMetrics {                                    // out: StudentMetrics
  const completed = rows.filter((r) => r.status === "Completed").length;   // → number

  return {
    statusCompleted: completed,
    statusIncomplete: rows.filter((r) => r.status === "Incomplete").length,
    statusNotEnrolled: rows.filter((r) => r.status === "Not Enrolled").length,
    totalCourses: rows.length,
    // Guard the division: 0/0 is NaN, and NaN renders as the text "NaN".
    completionPercentage: rows.length === 0 ? 0 : (completed / rows.length) * 100,
    programsAssigned: new Set(filtered.map((r) => r.program.id)).size,
  };
}
```

```typescript
// src/components/progress/StudentProgressView.tsx - the changed regions

// ── IMPORTS ─────────────────────────────────────────────────
import { FacetFilter, type FacetOption } from "./FacetFilter";
import { SortHeader } from "./SortHeader";
import { ColumnToggle } from "./ColumnToggle";
import {
  COLUMNS,
  computeMetrics,
  filterCourses,
  sortCourses,
  toggleColumn,
  type ColKey,
  type SortCol,
} from "./courseTable";

// Lines 62-248 (FacetOption, FacetFilter, SortHeader, ColumnToggle) are deleted.
// The useState<StudentMetrics> at 258-265 is deleted.
// The metrics useEffect at 396-419 is deleted.

// ── DERIVED VALUES (replacing the effect) ───────────────────
const filteredCourses = filterCourses(flatCourses, {   // → CourseRow[]
  levels: selectedLevels,
  statuses: selectedStatuses,
  search: searchText,
});

const metrics = useMemo(                               // → StudentMetrics
  () => computeMetrics(flatCourses, filteredCourses),
  [flatCourses, filteredCourses],
);

const hasActiveFilters =
  selectedStatuses.length > 0 || selectedLevels.length > 0 || searchText !== "";

const sortedCourses = sortCourses(filteredCourses, sort);   // → CourseRow[]
```

---

**End of Tutorial**
