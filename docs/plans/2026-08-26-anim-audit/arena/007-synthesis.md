# Plan 007 - screen transitions, theme switch, count-up

**No arena was run for this plan.** All three candidates died on
`You've hit your monthly spend limit` before producing any work, so this was implemented
directly. That is a lower bar than plans 001-006 and the record should say so: no
three-candidate diversity, no cross-judge, and no independent lens hunting for the thing
the implementer assumed. The arena has caught a real defect in every plan it ran on,
including three that I had asserted were fine.

Everything below was verified by frame sampling in a real browser, which is the part that
does not depend on having subagents.

## The scope decision

Plan 007 deliberately left open how much of the app `motion` should own. The split taken:

| Piece | Owner | Why |
| --- | --- | --- |
| Screen transitions | `motion` | React unmounts the outgoing screen before CSS can touch it. This is the one case where the platform genuinely cannot do the job |
| Theme switch | **native** `startViewTransition` | The platform already crossfades a whole document with no layout involvement. A library adds nothing |
| Count-up | `motion`'s `animate()` | Not expressible in CSS. Marginal cost is zero once `motion` is in for the screens, and `animate()` retargets on interruption for free |

`motion@13.1.1`, one dependency, imported from `motion/react`.

The rule applied: reach for the library only where React's unmount timing or a
non-interpolable value is the actual blocker. "It is installed, so use it" is the failure
mode the plan warned about.

## Screen transitions

`PageContent.tsx` picked one of five screens with a ternary chain. Now wrapped in
`AnimatePresence mode="wait"`.

**The key was the subtle part.** `currentView` alone is not sufficient: the string
`"programs"` resolves to a different screen depending on `userType`, so keying on it would
leave two different screens sharing one node and skip the transition entirely. The key is
a derived discriminant instead - `student-dashboard`, `supervisor-dashboard`,
`progress-<id>`, `program-<id>`, `builder`.

`mode="wait"` because these screens are full-height; overlapping two stacks their scroll
containers and the page scrolls twice.

Explicit tween, not Motion's default spring - the contract forbids visible bounce here.
Full `transform` strings rather than the `y` shorthand, which is not hardware-accelerated
(AUDIT category 5).

Measured, navigating dashboard -> builder:

    38 distinct frames
    1.00|translateY(0) -> 1.00|0.31 -> 0.98|1.94 -> 0.94|3.47 -> ... -> 1.00|translateY(0)

## Theme switch

`handleThemeToggle` wrapped in `document.startViewTransition`, timing set from the token
scale via `::view-transition-old(root)` / `::view-transition-new(root)`.

Firefox has no support and falls back to an instant swap - which is exactly the behaviour
this replaces, so there is no regression to guard against. `startViewTransition` confirmed
present in the test browser.

The old `requestAnimationFrame` wrapper is gone. It deferred the class flip by one frame
without coordinating it with anything, so whatever flash it was meant to prevent happened
regardless.

Measured across a toggle, six probes including the heading, the toggle button, `main` and
every metric value:

    layoutShiftedProbes: []

## Count-up

New `src/hooks/useCountUp.ts`. Counts from 0 on first real data and from the previous
value on every update after, so a metric going 4 -> 5 ticks by one rather than restarting.

Three details that matter:

- **Gated on `!isLoading`.** Plan 006 added a skeleton crossfade here; without the gate the
  counter would run once against the skeleton and again after the handoff.
- **`onComplete` sets the exact integer.** Rounding an eased float can stop one short,
  which on a counter reads as an off-by-one bug rather than as motion.
- **Reduced motion returns the value immediately**, derived rather than set in an effect.
  A counter's travel *is* its information, so slowing it is not the accessible answer.

The first draft set state inside the effect for the reduced-motion and disabled cases, and
`react-hooks/set-state-in-effect` correctly rejected it. Deriving is both cleaner and one
render cheaper.

Measured on a dashboard remount:

    0,0,0,0 -> 1,1,0,0 -> 2,2,0,0 -> 3,2,1,1 -> 3,3,1,1 -> settles 5,4,1,1

Landing values match the API exactly.

## A measurement error of mine, recorded

My first screen-transition sample reported **1 distinct frame**, which would have meant the
transition was not running. It was `document.querySelector('main')` grabbing the outer
`SidebarInset` wrapper rather than `PageContent`'s own `main` - there are two. Retargeting
the motion node by its inline style gave 38 frames.

Third time in this audit a measurement of mine was wrong rather than the code. The
discipline of "watch frames, not declarations" needs its own corollary: check the
instrument is pointed at the right element before believing a negative result.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
`git diff package.json` shows exactly one added dependency.
