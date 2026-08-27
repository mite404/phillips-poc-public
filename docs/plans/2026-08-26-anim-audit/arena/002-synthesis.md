# Arena synthesis - plan 002, accordion collapse

Three candidates, no cross-judge needed. Base: **B**, adopted essentially whole.

| | Model | Lens | Approach | Outcome |
| --- | --- | --- | --- | --- |
| A | opus | Upstream fidelity / keyframes | `@keyframes` + `--animate-accordion-*` | Rejected, with evidence |
| B | opus | Interruptibility and feel | `grid-template-rows` transition | **Base** |
| C | sonnet | Regression hunting | `grid-template-rows` transition | Rejected, does not animate |

No cross-judge was spawned. All three converged on the plan's central error, and the
approach question was settled by measurement rather than by opinion, so there was nothing
left for a judge to adjudicate. Per the arena skill: convergence is its own signal, and
grafting is unnecessary when one candidate's shape subsumes the others'.

## The plan was wrong, and all three found it

```
$ grep -rn "ui/accordion" src/
  NO CONSUMERS
```

`src/components/ui/accordion.tsx` is imported by nothing. `StudentDashboard.tsx:12` does
`import * as Accordion from "@radix-ui/react-accordion"` and uses the primitives directly
at lines 265 and 372. Following the plan literally would have fixed a file nobody renders,
passed every check, and animated nothing.

Three independent candidates finding the same thing is the strongest signal this arena has
produced. It is also the third instance this session of the same failure class: something
that looks correct while doing nothing, with no build error.

**The plan also described the bug wrong.** It says accordions snap because
`animate-accordion-up/down` reference nonexistent keyframes. Half true. The live panels
carried `className="px-4 pb-4 pt-2"` and no animation class at all. The vendored file's
dead keyframes are a genuine latent bug that would bite the first person to import it, but
the observed snap was simply the absence of any animation.

B's fix resolves both: it repairs the vendored component and makes `StudentDashboard`
actually use it, which removes the dead code rather than leaving it to rot.

## Two undocumented requirements that decided the outcome

Both found by B, both verified against `node_modules`.

**1. The transition cannot live on `Accordion.Content`.**

Radix's `CollapsibleContentImpl` sets `node.style.transitionDuration = "0s"` and then
calls `getBoundingClientRect()` on every toggle. Confirmed in
`@radix-ui/react-collapsible/dist/index.mjs`. That forced reflow resolves style with the
new `data-state` already committed, so any transition on that node completes *inside the
flush* and the panel snaps.

This is why **candidate C does not animate**, despite C reporting verified computed styles
of `0.32s ease-out`. The declarations are present on the element; the transition never
gets a chance to run. Reading computed style proves the CSS is there, not that anything
moved. C's browser verification checked the wrong thing.

B's fix: put the grid transition on an inner wrapper Radix never touches.

**2. `forceMount` is mandatory for a transition-based collapse.**

`@radix-ui/react-presence` gates unmount on `getComputedStyle(node).animationName`. It
watches animations only and never observes transitions, so without `forceMount` the node
is hidden and its children dropped on the same frame the state flips, leaving the closing
transition nothing to animate.

A discovered this and correctly identified it as a landmine for the grid approach. B found
it independently and solved it, including the accessibility cost that comes with it:
`forceMount` leaves collapsed panels in the DOM, and B confirmed a "Book Class" button
inside a closed panel was reachable by `.focus()`. Adding `invisible` to the wrapper, and
transitioning `visibility` alongside `grid-template-rows`, removes it from the a11y tree
and tab order while keeping it visible for the duration of the close.

## Why A lost, in A's own numbers

A implemented the keyframe approach faithfully and then measured its weakness honestly
rather than conceding it in the abstract. Reversing an open at 80ms:

    keyframe:    92px -> 138px      a 46px jolt in the WRONG direction, then full collapse
    transition:  110 -> 107 -> 87 -> 55 -> 15 -> 0     continuous

Four rapid clicks on A's build produced single-frame jumps of +29, **-160**, +30 px on a
302px panel. Cause: Radix re-measures at the interrupt with `animation-name: none`, so the
keyframe's `from` is always full height regardless of where the panel actually is.

A also rejected the one CSS-only mitigation for the right reason: a single keyframe with
`animation-direction: reverse` makes Presence's `isAnimating` check false, hitting
`send("UNMOUNT")` and killing the close outright.

A's honesty here is the reason this record can state the tradeoff with numbers instead of
theory. A also established the one axis where keyframes genuinely win, and said so:
`fr` interpolation is 93.97% global support, Safari 16.0+. Below that, B's collapse snaps
rather than animating - which is exactly today's behaviour, so it degrades gracefully.

## Verified by the parent, in a real browser

Not taken on any candidate's word. Measured on the applied result at 1440px:

**Open** - 15 distinct heights, 302px panel:

    t=26ms  125px   41%
    t=42ms  174px   58%
    t=59ms  212px   70%
    t=126ms 282px   93%
    settles 302px

70% of travel in the first 59ms of 320ms. **Fast start, long landing** - the contract's
directive, confirmed rather than asserted.

**Close** - deltas per frame: 5, 16, 23, 28, 33, 37, 37. Increasing, so accelerating away.
Correct for an exit, and at 160ms it is 50% of the enter, satisfying contract rule 1.

**Reversal at 212px:** `212, 212, 204, 184, 157, 120, 80, 36, 0`. Monotonic descent,
**zero wrong-direction jump**, against A's -160px at the same test. B's lens claim holds.

**Closed state:** wrapper computes `visibility: hidden`, so `forceMount` does not leak
collapsed content into the a11y tree.

## Filed, not fixed

Candidates surfaced four pre-existing bugs outside this plan's scope:

1. **`src/index.css:378-386` removes every focus indicator in the app** via
   `*:focus-visible { outline: none !important }` plus zeroed `--tw-ring-shadow`. WCAG 2.1
   AA failure, 2.4.7. Filed as [plan 010](../010-restore-focus-rings.md). This is the most
   serious accessibility issue the audit has produced.
2. **`App.css`'s `#root { max-width: 1280px; margin: 0 auto }` shifts the main grid under
   the sidebar**, clipping every left-column program title - "fety Ramp-up" instead of
   "Q3 Safety Ramp-up". Confirmed visually in a screenshot. Plan 008 already removes this
   file; it turns out to fix a visible bug, not just delete dead CSS.
3. **`sonner` ships `transition: none !important` under reduced motion**, which is exactly
   what contract rule 6 forbids. Relevant to plan 005.
4. Horizontal overflow at 390px, and course rows inside panels not keyboard-focusable.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests pass.
