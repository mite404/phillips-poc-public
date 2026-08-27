# Arena synthesis - plan 006, loading, swaps and stagger

Three sonnet candidates. Base: **C**. All three independently hit the same trap.

| | Lens | Outcome |
| --- | --- | --- |
| A | Reuse and where the abstraction belongs | Rejected. Worked around the trap with wrappers |
| B | Stagger correctness | Rejected. Best stagger evidence, filed a real bug |
| C | Frame sampling and layout shift | **Base**. Smallest diff, cleanest escape from the trap |

## The trap all three found

`cn()` runs `tailwind-merge`, which treats every `transition-*` class as **one
mutually-exclusive group**. Verified directly:

    card:   hover:shadow-md transition-shadow duration-(--duration-micro) ease-out
    + fade: transition-opacity duration-(--duration-swap) ease-out
    merged: hover:shadow-md cursor-pointer transition-opacity ...
            -> transition-shadow silently GONE

Adding this plan's crossfade to a card would have deleted plan 003's hover animation. Third
occurrence in this audit; plan 004 lost its cva base list the same way. Now written into
`MOTION-CONTRACT.md` as a rule with three sanctioned escapes.

Each candidate escaped differently, which is what made the comparison worth having:

- **A**: wrapper `<div>`s for cards, an explicit combined list for `TableRow` (a `tr`
  cannot be wrapped). Routes around the trap. Largest diff, 191/127.
- **B**: drove the stagger with `animation` instead of `transition`. `animation-*` and
  `transition-*` are disjoint groups, so they coexist untouched. Verified. 126/18.
- **C**: folded everything into one arbitrary-*property* declaration with per-property
  timing. 70/16.

## Why C

```
[transition:box-shadow var(--duration-micro) var(--ease-out),
            opacity    var(--duration-pop)   var(--ease-out),
            translate  var(--duration-pop)   var(--ease-out)]
```

One declaration, one class, per-property timing, collision structurally impossible. The
hover stays crisp at 100ms while the entrance runs at 240ms - which neither of the other
approaches expresses as directly.

C also found the reason `transition-[...]` cannot do this: that form sets
`transition-property` only and pulls timing from `--tw-duration`, so every listed property
shares one duration. The arbitrary-property form `[transition:...]` emits a real shorthand.
Verified in built CSS.

Smallest diff of the three, and its constants sit in `ui/card.tsx` next to
`cardInteractiveClasses`, matching the precedent set in plan 003.

## Verified by the parent

**Icon swap** - both icons mounted and stacked in one grid cell:

    8 distinct frames   0.00/1.00 -> 0.41/0.59 -> 0.70/0.30 -> 1.00/0.00
    layoutShiftedElements: []

Header, `h1`, logo and button rects are byte-identical across the swap. Zero reflow.

**No collision, confirmed on live cards:**

    transitionProperty: "box-shadow, opacity, translate"
    transitionDuration: "0.1s, 0.24s, 0.24s"

**Stagger ladder and cap:**

    card 1: 0s      cards 2-8: 0.045 0.09 0.135 0.18 0.225 0.27 0.315s
    card 9+: 0s     (cap holding)

**No re-stagger on re-render** - this was the plan's stated main risk. Opened and dismissed
a modal, which re-renders the parent while preserving list nodes: **39 frames sampled, 1
distinct opacity value, `1.000`**, same DOM node throughout.

### Two false alarms of my own, worth recording
My first re-stagger test read opacity `1.000 -> 0.000` and looked like a failure. The node
had been unmounted by the filter - I was sampling a detached element. My second alarm, that
cards 2-8 had lost their hover because their computed `transitionDelay` read `0.045s`
rather than `0s, 0s, 0s`, was just how the computed style serialises a single delay applied
to three properties.

Both were my test being wrong, not the implementation. Recorded because "the measurement
disagreed with the code" resolved in the code's favour twice here, and the instinct to
trust the measurement needs the same scrutiny as the instinct to trust the declaration.

## B's contribution: the strongest stagger evidence, and a real bug

B measured non-refire the harder way, holding a reference to a card that survived a filter
change which unmounted 8 siblings, and sampling 37 frames. It also clicked the last card's
button at t=277ms *while that card's own opacity still read 0*, mid-delay, proving the
stagger never blocks interaction.

And it filed a genuine pre-existing bug: `useProgramBuilder.ts:31` fetches in a `useEffect`
with **no `AbortController` and no stale-response guard**, while `main.tsx` runs
`StrictMode`. The effect double-fires against the live API and out-of-order responses
remount cards mid-cascade. Verified both halves. Filed as
[plan 012](../012-fetch-abort-guard.md).

That bug was invisible before this plan. A card remounting mid-load used to look like
nothing; with a stagger it visibly restarts its entrance while its neighbours continue.
Motion is a diagnostic - it makes render churn legible.

## Also landed
- `StudentProgressView.tsx`'s hand-rolled `bg-slate-200` / `bg-slate-100` skeletons
  replaced with the existing `<Skeleton>`. C confirmed the theme dependency directly:
  `bg-primary/10` composites correctly against both `rgb(255,255,255)` and
  `oklch(0.09 0.002 17.2)`, where the opaque slate clashed in dark mode.
- Skeleton-to-content crossfade at all five call sites, verified under real Slow-3G
  throttling: 8 distinct frames over ~165ms with no double-exposure at any sampled frame.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests,
including `StudentProgressView.test.tsx`.
