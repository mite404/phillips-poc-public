# Arena synthesis - plan 005, overlays

Three candidates (one opus, two sonnet). Base: **B**, with mandatory grafts from **A** and
**C**. This plan produced more corrections to the audit than any other.

| | Model | Lens | Outcome |
| --- | --- | --- | --- |
| A | opus | Radix internals and the cascade | Grafted from. Found the origin bug |
| B | sonnet | Preserve what is already correct | **Base**. Smallest diff, solved collision-flip |
| C | sonnet | Exits and reduced motion | Grafted from. Found the plugin-removal gap |

## My audit was wrong: the trigger origins were dead CSS

Plan 005 listed this under **"Already correct - do not fix"**:

> `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx` all set
> `origin-[--radix-*-transform-origin]`. These already scale from their trigger.

False. Verified on the pre-change build:

    transform-origin: var(--radix...)  ->  0   valid
    transform-origin: --radix...       ->  5   INVALID, the browser drops it

Tailwind v3 read the square-bracket arbitrary form as an implicit `var()`. **Tailwind v4
does not.** Same silent v3-to-v4 syntax change that killed the accordion keyframes in plan
002. Every dropdown, popover and tooltip in this app has been scaling from its own centre.
Contract rule 3 was never satisfied anywhere.

This mattered more than a missed polish item, because **candidate B's entire directional
strategy depends on that origin being live** - B deliberately dropped directional
translate and relies on `transform-origin` alone. B was briefed to preserve the origin, did
so faithfully, and thereby preserved broken CSS. Without A's fix, B's poppers would scale
from centre with no directional cue at all - worse than what they replaced.

Verified after the graft, on a real open dropdown: `transform-origin: "224px 106px"`, a
live pixel origin from Radix, not `center`.

## Removing tailwindcss-animate silently killed part of plan 001

Plan 001's reduced-motion block zeroed the plugin's private variables
(`--tw-enter-translate-*`, `--tw-exit-scale`, …). Correct at the time - those carried all
the app's real travel. All three candidates remove the plugin, at which point that whole
mechanism is decoration.

B noticed and rewrote the block from "four mechanisms" to three, documenting the removal.
But B's replacement claim - that everything now clamps via `--travel-md` / `--scale-in` -
does not hold for the **sheet**, which uses literal `translate-x-full`. Nothing reaches a
literal. C found this by forcing the media query active with
`CSSMediaRule.media.mediaText = 'all'` and sampling frames.

Grafted C's fix: a `--travel-sheet` token, `100%` normally and `0%` under reduced motion,
used on all four sides. Emitted correctly, including negatives as
`calc(var(--travel-sheet)*-1)`.

**The general lesson:** a later plan can invalidate an earlier plan's verified work. Plan
001 was correct when checked and quietly stopped being correct here. Sequential plans
sharing a contract have to re-verify the invariants they inherit, not only their own.

## Convergence: two things the plan got wrong

A and C, independently, one opus and one sonnet:

1. **Radix Presence deletes transition-based exits.** Confirmed at
   `@radix-ui/react-presence/dist/index.mjs:59-60` -
   `else if (currentAnimationName === "none" ...) send("UNMOUNT")`. It watches
   `animationName` and never observes transitions. A measured **zero live exit frames** by
   ablation. All three candidates converged on the same fix: a placeholder keyframe that
   animates one unused custom property, purely so Presence sees an `animationName` and
   defers unmount while the real transition plays. B's `exit-gate` is scoped to
   `data-[state=closed]` and duration-matched to the exit, so the node unmounts exactly as
   the transition ends.
2. **`@starting-style` is required**, contradicting my plan's trap note. A's ablation: 1
   distinct opacity value without it, 16 with. Radix commits the open state before first
   paint.

## What B solved that A documented as unfixable

A reported, honestly, that collision-flipped poppers enter from the wrong direction:
`@starting-style` is captured inside Presence's layout effect, before floating-ui
positions the element, while `data-side` still holds the requested side. A called it a
known limitation.

B fixed it. Using a `MutationObserver` on a real trigger, B measured `data-side` inserted
as `"bottom"` and flipping to `"top"` 2ms later, then dropped directional translate from
the popper family entirely in favour of `transform-origin` plus scale. The origin is a
live custom property Radix keeps current, read fresh every frame rather than captured
once, so "grows from its trigger" stays correct on every side, flipped or not.

This is the arena working as intended: the opus candidate found and documented the
constraint; a sonnet candidate found the way around it.

## Rejected, with evidence

- **`forceMount`** (which plan 002 used for the accordion). B verified against Radix source
  that it would permanently activate `FocusScope` and `DismissableLayer` on page load for
  the four modal-by-default components. The exit-gate keyframe achieves the same deferral
  without that cost.
- **Directional `data-[side]` translate on poppers.** Measured broken on flip, see above.
- **`overlay` / `allow-discrete`.** A checked: Radix never uses the top layer.
  `matches(":modal")` and `":popover-open"` are both false on an open dialog, so my plan's
  trap note was inapplicable here.

## Verified by the parent, frame-sampled on the grafted result

Sidebar user dropdown, real pointer input, computed values per rAF tick:

    ENTER   15 distinct frames
            0.000|0.96 -> 0.286|0.971 -> 0.525|0.981 -> 0.700|0.988 -> 1.000|1
            opacity deltas 0.286, 0.239, 0.175, 0.113 - shrinking, so decelerating

    EXIT    11 distinct frames
            1.000|1 -> 0.980|0.999 -> 0.932|0.997 -> 0.000|0.96
            then unmountedAfter: true - the gate released cleanly

    transform-origin: 224px 106px      live, from the trigger
    transition-property: opacity, scale
    duration: 0.24s                    --duration-pop

## Filed, not fixed

**Dialog exits will never be seen in this app**, regardless of CSS. B found that both real
consumers unmount the whole component tree in the same callback that closes the dialog:

    CourseDetailModal.tsx:54   if (!course) return null;
    RosterList.tsx:299         {selectedLearner && firstCourseId && (<EnrollmentModal .../>)}

Radix Presence never gets the chance to defer. This is a consumer-side React pattern, not
a CSS problem, and is outside plan 005's five-file scope. Worth its own ticket.

Also: sonner ships `transition: none !important` under reduced motion, which contract rule
6 forbids. Out of scope here.

## A process bug on the parent's side

I asked candidates to report `git diff`, which silently omits **new files**. B's
`src/lib/overlay-motion.ts` was untracked and absent from its diff; applying it produced a
build that could not resolve the import. Checked every earlier arena worktree afterwards -
plans 001 to 004 had no untracked files, so nothing was lost. Future arenas should ask for
`git add -A && git diff --cached`.

## A footnote on comment scanning

Tailwind scans comments. B found that merely mentioning the old plugin's class names in a
comment kept the plugin alive. The same thing happened to me while writing the fix: my
explanatory comment about the broken origin syntax contained the broken syntax, and
emitted the dead rule straight back into the bundle. The comment now describes the form
without spelling it.

Two wildcard rules remain in the bundle, `origin-[--radix-*]` and its sibling, generated
from the prose of this plan document. Plan 009 removes them.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
Zero invalid origin rules from `src/`, three valid.
