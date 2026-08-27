# Arena synthesis - plan 001, motion tokens

Three candidates, one cross-judge. Base: **B**. Grafts from **A** and **C**.

## Roster

| | Model | Lens | Outcome |
| --- | --- | --- | --- |
| A | opus | Tailwind v4 native - do these tokens actually emit? | Grafted from |
| B | opus | Accessibility - the reduced-motion block | **Base** |
| C | sonnet | Minimal surface - which tokens have a real consumer? | Grafted from |
| Judge | sonnet | Read-only, scored against the plan's rubric | Agreed with the parent's pick |

No dropouts. **The cross-judge shared the parent's model family** (all-Claude roster),
so its agreement is weaker evidence than a second vendor's would have been. It also
shared candidate C's model, and it still scored C lowest, which cuts against the
obvious bias in that direction.

Lens diversity was the deliberate choice over running the same prompt at three tiers:
the Agent tool drops the effort half of a model spec, so three identical prompts would
have been one opinion sampled three times. It paid off - each candidate found something
the other two missed.

## Why B is the base

B is the only candidate that verified its work against **computed styles in a real
browser** rather than against the token layer in isolation. That is how it found the
thing none of us anticipated:

> A token-only reduced-motion override would be a literal no-op on this app today.

Nothing consumes a motion token until plan 002 lands. The movement that actually
exists lives in `tailwindcss-animate`'s private variables:

    --tw-enter-translate-y: 100%    Sheet
    --tw-enter-translate-y: -48%    Dialog
    --tw-enter-scale: .95           zoom-in-95

A full viewport-height slide is precisely the vestibular trigger the setting exists
for, and no token reaches it. B zeroes those vars directly.

B also wins the cascade **without `!important`**. Tailwind emits utilities into
`@layer utilities`; an unlayered rule beats a layered one regardless of specificity.
That leaves a component able to opt out with `duration-500!`, which A's and C's blanket
`!important` would have closed off.

## Grafted from A

**1. `@theme static` instead of `@theme inline` - this one was mandatory, not polish.**

A found that Tailwind tree-shakes theme variables it sees no reference to. Verified
independently, building each candidate with the plan docs removed from the content scan:

    B (@theme inline), plans/ excluded:   --ease-drawer ABSENT   (variable and utility)
    A (@theme static), plans/ excluded:   --ease-drawer SURVIVES

The tokens appeared to work only because Tailwind scans markdown, and the class names
written in the prose of these very plan files looked like consumption. Plan 001's
deliverable was propped up by its own documentation. `@theme static` force-emits all
four regardless of what the scanner sees.

**2. The duration namespace comment was wrong.** One decisive test:

    .duration-pop{--tw-duration:var(--transition-duration-pop);transition-duration:var(--transition-duration-pop)}

Tailwind resolves `duration-*` against `--transition-duration-*`, not `--duration-*`.
The contract said "no `--duration-*` namespace", which is true as written but implied
none exists at all. Corrected in `MOTION-CONTRACT.md`. The plain-custom-property
approach still stands, to avoid two names for one value.

**3. The `--ease-exit` / stock `ease-in` collision.** `cubic-bezier(0.4, 0, 1, 1)` is
byte-identical to Tailwind's `--ease-in` (`theme.css:386`), so output merges them into
`.ease-exit,.ease-in{...}`. Documented in the CSS so nobody "deduplicates" it later.

**4. Exemptions for `.animate-spin`, `.animate-ping`, `.animate-bounce`,** not just
`.animate-pulse`. None are in the tree today. The moment one is, B's block would have
strobed it exactly as C's strobed the pulse.

## Grafted from C

**The token-to-consumer grep.** C cross-referenced every proposed token against plans
002-008 and found `--travel-sm` and `--travel-lg` had no consumer anywhere. Both cut,
**and the contract updated to match** - the judge's objection to C's cut was the
resulting doc/code mismatch, not the cut itself, so removing both closes it.

## Rejected from C

**The blanket `animation-duration` clamp.** C's block:

    *, *::before, *::after { animation-duration: 60ms !important; }

`animation-duration` reaches looping animations, not just one-shot transitions.
`--animate-pulse` is `pulse 2s ... infinite` and `<Skeleton>` uses it across
MetricCard, RosterList, ProgramBuilder, ProgramManager and the sidebar. C compresses a
2s breathing pulse to a 60ms cycle: roughly 16 flashes per second, on every skeleton,
for exactly the users who asked for less motion.

The element is low-contrast (`bg-primary/10`), so the luminance delta is small and this
is not a seizure-trigger claim without that math. It is still the opposite of what the
setting is for, and worse than leaving the pulse alone.

The general lesson, and the reason this is recorded rather than just fixed:
`transition-duration` and `animation-duration` need **opposite** treatment under
reduced motion. Clamping a one-shot transition shorter makes it gentler. Clamping a
loop shorter makes it faster, and faster is the thing being removed.

## Found but deliberately NOT fixed here

**4.6 kB of the CSS bundle is generated from markdown prose in `docs/`.** Controlled
build on the untouched tree:

    WITHOUT docs/: 63,288 bytes
    WITH docs/:    67,884 bytes      -> 4,596 bytes, 6.8%

Tailwind's scanner has no file-type opinion. Backticked class names and code samples
in `SPEC.md`, `FOR_ETHAN.md`, `IMPLEMENTATION.md` and the PR tutorials all become real
emitted CSS. Verified fix, one line: `@source not "../docs";` returns the bundle to
63,288 bytes. Safe, because a class used by both docs and `src/` is still emitted
from `src/`.

This predates the animation work entirely and is out of plan 001's additive scope.
**Filed for a follow-up plan.** Note the interaction: applying it before the
`@theme static` graft would have silently deleted three of the four easing tokens.

## Verification

| Check | Result |
| --- | --- |
| `bun run build` | pass, 1.07s |
| `bun run lint` | pass, exit 0, `--max-warnings 0` |
| `bun run test --run` | pass, 4 files, 56 tests |
| Tokens survive with `docs/` out of the scan root | all four easings present |
| Reduced-motion block emitted unlayered, after `@layer utilities` | confirmed at byte 64489 |
| `animate-pulse` spared under reduced motion | confirmed |

Bundle 67,884 -> 69,609 bytes (+1,725). Both figures include the ~4.6 kB of
docs-generated CSS above, so neither is a production number.

**Not verified:** nothing in this plan is visible yet, so there is no feel-check to
run. The curves are judged when plan 002 first consumes them.
