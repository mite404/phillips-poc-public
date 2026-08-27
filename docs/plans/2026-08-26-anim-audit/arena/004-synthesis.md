# Arena synthesis - plan 004, press feedback

Three sonnet candidates. Base: **C**, with a graft from **A**. **A and B both shipped a
press that does not animate.**

| | Lens | Outcome |
| --- | --- | --- |
| A | Blast radius - where the rule lives | Grafted from. Widest correct coverage |
| B | Interaction correctness per input modality | Rejected. Best test log, wrong property |
| C | Frame sampling - prove it actually moves | **Base**. Only candidate with the right property |

## The defect that decided it

Tailwind v4 compiles `scale-*` to the **standalone `scale` CSS property**, not
`transform: scale()`:

    .active\:scale-\(--scale-press\):active{scale:var(--scale-press)}

A and B both then wrote `transform` into their transition-property list. `transform` and
`scale` are separate animatable properties. Verified with a synthetic element in Chrome:

    transition-property: transform  ->   1 distinct value  (0.5, 0.5, 0.5)   SNAPS
    transition-property: scale      ->  13 distinct values (1, 1, 0.980876)  animates

So on A's and B's builds the button flips to 0.97 and back with no interpolation. The
feedback is visible; the motion is not there.

C wrote `transition-[color,background-color,border-color,scale]` and said why:

> given contract rule 5's own guidance to prefer the individual scale/translate/rotate
> properties over the transform shorthand, the property that actually needs to be in the
> list is `scale`, not `transform`. I used `scale`; had I taken the plan literally I would
> have written a transition for a property nothing in this diff ever sets.

**The plan told them to use `transform`.** Step 2 says "extend the existing
`transition-colors` to include `transform`". Two of three followed it. Corrected.

### Why B's measurement missed it
B read `getComputedStyle(...).transitionDuration` on mouseup, got `0.1s`, and concluded
the settle worked. The number is real - the declaration is on the element - but it governs
a list containing `transform`, and the property that changes is `scale`. The duration
applied to nothing.

A had the other half: it proved Tailwind emits `scale:` while debugging its own
link-variant override, and still left `transform` in the cva list. Having the fact was not
enough to connect it.

This is the fifth instance in this audit of a check that reads a declaration instead of
watching a frame, and the third time it produced a confident false positive.

## Second trap: tailwind-merge silently eats the base transition list

Verified by running `twMerge` directly:

    base:    transition-[...,scale] duration-(--duration-micro) ease-out active:scale-(--scale-press)
    variant: bg-primary hover:bg-primary/70 transition-colors
    merged:  duration-(--duration-micro) ease-out active:scale-(--scale-press) bg-primary
             hover:bg-primary/70 transition-colors
             ^ the whole transition-[...] list is gone

`cn()` runs tailwind-merge, which treats the base's arbitrary list and each variant's
`transition-colors` as one class group and keeps whichever `cva` appends last - the
variant's. Any implementation that edited only the base string and left the six variant
strings alone would have shipped a press with no transition on five of six variants.

All three candidates removed the per-variant `transition-colors` independently. That fixes
this and satisfies the plan's "written once" requirement.

## Grafted from A: coverage

C edited the cva bases and the raw buttons. A additionally added a `@layer base` net:

```css
button { transition: scale var(--duration-micro) var(--ease-out); }
button:active:not(:disabled) { scale: var(--scale-press); transition-duration: 0s; }
```

This reaches the buttons no cva touches: Radix's `DialogClose` and `SheetClose`, the raw
`Accordion.Trigger` in `StudentDashboard`, the table sort trigger at
`StudentProgressView.tsx:179`, and the class-session picker at `EnrollmentModal.tsx:117`.
The last two are real controls my plan's file list missed; both A and C found them
independently.

`@layer base` matters. Built CSS confirms base opens at byte 4927 and utilities at 8782,
so any Tailwind utility on a specific button outranks the net. This repo has been bitten
twice by unlayered rules silently outranking utilities (plans 001 and 003), and this is
the deliberate inverse.

B rejected the wide net partly on a stale premise: it argued nothing renders `<Accordion>`,
citing plan 003's dead-code finding. That was true of `ui/accordion.tsx` **before plan
002** rewired `StudentDashboard` to use it. It is live now.

## Also grafted from A: the link variant does not depress

`variant="link"` renders as inline text, where a depress reads as a glitch. A excluded it
with `active:scale-100`, which cancels correctly **because it also compiles to `scale`** -
had the base used `transform`, the two would have composed rather than cancelled and link
buttons would have kept depressing despite the override.

## The asymmetry mechanism

One `:active` selector, two durations. A transition uses the properties of the state being
moved **to**: pressing resolves to `:active`, releasing resolves back to the base.

    active:duration-0                    -> press, instant
    duration-(--duration-micro) ease-out -> release, 100ms decelerating

C measured that a 0-duration change queues no transition events at all, contrasted against
a clean `transitionend` with `elapsedTime: 0.1` on every release. The press is not merely
fast, it is architecturally instantaneous.

## Verified by the parent, sampling frames

Release on a real button, computed `scale` per rAF tick:

    0.97 -> 0.97 -> 0.988086 -> 0.996213 -> 0.998979 -> none      8 distinct values

Deltas shrink into the landing, which is the contract's curve. Coverage: 14 of 25 buttons
sampled across the supervisor view, all reporting `scale` in the transition list at 0.1s.
Built CSS confirms the base-layer net, its `:not(:disabled)` exclusion, and the link
opt-out.

## Findings from B worth keeping

1. **`:active` never fires on Enter** for a native `<button>` in Chrome. Measured on two
   elements, one in the capture phase to rule out a swallowed event. Fires on Space
   (at keyup), never on Enter. **The plan's rubric item 5 was factually wrong** and has
   been corrected.
2. **Touch**: `:hover` sticks after a tap as the contract predicts, but `:active` clears
   correctly. No `hover:hover` gate is needed, because nothing hover-paired was added.
3. **Disabled**: suppressed two ways - `pointer-events-none` blocks the pointer, and a
   native disabled button is out of the tab order, so Space never reaches it. The
   base-layer net also carries `:not(:disabled)`.

## Known limitation, from C

A button whose own click handler unmounts it never shows its spring-back: the node leaves
the DOM before the queued 0.97 -> 1 transition gets a frame. Same shape as the Radix
forced-reflow bug from plan 002. Inherent to self-removing buttons, not fixable here.

## Not verified

`prefers-reduced-motion` end-to-end. The browser tooling available has no such emulation
parameter (same limitation recorded for plan 003). Structurally, plan 001's block sets
`--scale-press: 1` and collapses `--duration-micro`, so the press flattens while the
colour change survives - correct by construction, but not confirmed in a rendered frame.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
