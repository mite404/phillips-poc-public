# 003 - Replace `transition-all` with named properties

Audit commit `7fdde76`. Depends on: 001. Read `MOTION-CONTRACT.md` first.

## Context

`transition: all` animates every animatable property, including ones nobody intended:
colors during a theme switch, layout during a resize. It runs off the compositor and it
is an instant code-review tell. Contract rule 4 forbids it.

Six sites in this repo use it. Two are on paint-bound `box-shadow` hovers that fire tens
of times a day; one is on the progress bar, where it drags `width`, `background-color`,
and everything else along with the intended `transform`.

## Files and current state

| File:line | Current | Actually animating |
| --- | --- | --- |
| `src/components/ui/progress.tsx:19` | `h-full w-full flex-1 bg-primary transition-all` | `transform` (the component's own inline style at line 20, NOT Radix - Radix sets no style on Indicator) |
| `src/components/common/CourseCard.tsx:37` | `p-4 hover:shadow-md transition-all cursor-pointer border-border` | `box-shadow` |
| `src/components/ProgramBuilder.tsx:205` | `... p-3 hover:shadow-md transition-all cursor-pointer border-border` | `box-shadow` |
| `src/components/ProgramManager.tsx:180` | `... p-4 hover:shadow-md transition-all cursor-pointer border-border` | `box-shadow` |
| `src/components/ProgramBuilder.tsx:178` | `px-6 py-2 text-sm font-medium transition-all focus-visible:ring-0 ...` | background / text color on a tab |
| `src/components/ui/sidebar.tsx:285` | `absolute inset-y-0 z-20 hidden w-4 ... transition-all ease-linear ...` | `background-color` on `::after` |

`src/components/ui/accordion.tsx:25` is a seventh site, owned by plan 002. Do not touch
it here.

## Target values

- Card hover (`box-shadow`): `--duration-micro` (100ms), `--ease-out`. Hover is
  high-frequency and low-travel; it must not linger.
- Progress bar: `transition-transform`, `--duration-surface` (320ms), `--ease-out`. A
  progress bar that snaps reads as a glitch; one that decelerates reads as arrival.
- Tab and sidebar-rail color changes: `--duration-micro`, `--ease-out`.

## Steps

1. Replace each `transition-all` with an explicit property list. Prefer Tailwind's named
   utilities (`transition-shadow`, `transition-transform`, `transition-colors`) over
   arbitrary syntax where one fits exactly.
2. Attach a duration and easing token to each. A bare `transition-shadow` still runs at
   Tailwind's stock 150ms on the stock curve, which is not the contract's curve.
3. The three hover-card sites are near-identical strings across three files. Decide
   whether that repetition should collapse into something shared. There is already a
   `cn()` helper at `src/lib/utils.ts` and a `class-variance-authority` dependency in
   use for variants (`src/components/ui/button-variants.ts` is the exemplar). Extracting
   is not required, but if you extract, follow that existing pattern rather than
   inventing a new one.
4. `sidebar.tsx:285` also carries `ease-linear`. Linear is defensible on a constant-rate
   rail, but the property being animated is a hover color. Judge and state the call.

## Scope boundaries

- Do not change any visual design: same shadow, same colors, same hover targets.
- Do not touch `accordion.tsx` (plan 002) or add press feedback (plan 004).
- Do not restructure the card components.

## Arena rubric

1. Zero `transition-all` remaining outside `accordion.tsx`. Grep proves it.
2. Every replacement names only properties that actually change on that element.
   Over-listing (`transition-[box-shadow,color,background-color]` where only shadow
   moves) is as wrong as `all`.
3. Every transition carries a duration and easing token from the contract.
4. Hover feels immediate, not laggy. 100ms, not 300ms.
5. If the three card strings were extracted, the abstraction follows the existing
   `cva` / `cn` pattern and does not add a file for its own sake. If they were not
   extracted, the rationale says why.

## Verification

1. `grep -rn "transition-all" src/` returns only `accordion.tsx` (or nothing, if 002
   already landed).
2. `bun run build`, `bun run lint`, `bun run test` pass.
3. Feel-check in the browser:
   - Sweep the mouse across the course grid. Shadows should lift crisply and not trail.
   - DevTools, Performance, record the sweep. No layout thrash, no long paint bars.
   - Watch a progress bar update on the supervisor dashboard. It should ease into its
     new value.
   - Toggle the theme with a card hovered. The card must not animate its color change
     twice, once from `transition-colors` and once from the theme switch.
