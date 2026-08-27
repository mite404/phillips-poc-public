# Arena synthesis - plan 009, exclude docs from the content scan

Three sonnet candidates. Base: **B**, which found a better mechanism than the plan proposed.

| | Lens | Outcome |
| --- | --- | --- |
| A | Rule-by-rule safety proof | Strongest safety evidence; corrected the record |
| B | Is `@source not` the right mechanism? | **Base**. Found the real allow-list and a scope gap |
| C | Visual and motion regression in a browser | Confirmed zero regression; documented a false alarm |

## The plan picked the wrong lever

Tailwind 4.1.17 exposes three, not two. Measured on this tree:

| Mechanism | Bundle | Delta |
| --- | --- | --- |
| baseline | 74,088 B | - |
| `@source not "../docs"` (the plan's proposal) | 68,940 B | -5,148 |
| `@source "../src"` | 74,088 B | **0 - purely additive, does nothing** |
| `@import "tailwindcss" source("../src")` | **68,793 B** | **-5,295** |

The middle row is the trap, and it is the obvious first guess. `@source "path"` reads like
an allow-list but only *adds* a scan root; it never restricts one. Output is byte-identical,
so nothing about the build reveals that it did nothing. The real allow-list is a parameter
on the import itself, which rescopes automatic detection rather than adding to it.

**The deny-list also had a scope bug.** It excludes `docs/` only, so `AGENTS.md` at the
repository root keeps emitting phantom classes. Verified on the pre-change build:

    AGENTS.md prose: "...this repo's history is lowercase"
      .lowercase           emitted: True
      .bg-phillips-red     emitted: True
      .text-phillips-blue  emitted: True

Plain English generating CSS. A deny-list is whack-a-mole - every new top-level file needs
remembering. The rescope is self-maintaining: anything outside `src/` is excluded by
default. The inverse risk, a genuine new source directory silently going unscanned, is
narrow here because `AGENTS.md` itself states the app lives entirely under `src/`, and the
fix is one explicit `@source` line rather than reactive patching.

## The safety proof

A parsed both bundles with `css-tree` and diffed **rule sets**, not byte counts: 0 rules
added, 72 selectors removed, 71 unique. Verified in both directions - zero of the removed
classes appear as a string literal anywhere in `src/**/*.{ts,tsx}`, and all 71 trace to a
literal in `docs/`. C independently reached the same conclusion with a brace-depth parser
over 76 selectors.

**No component turned out to depend on a docs-only class.** That was the headline risk.

## Why this plan was safe to apply at all

All four contract easing tokens survive with the docs excluded:

    --ease-out  --ease-drawer  --ease-exit  --ease-in-out    all present

That is only true because of plan 001's arena. Candidate A there found that under
`@theme inline` those curves exist in the bundle **only** because the plan documents
mention their names, and forced `@theme static` instead. At the time it read as pedantry
about tokens nothing consumed yet.

Had 001 shipped with `inline`, this one-line change would have silently deleted three of
the four easing curves, and every transition using them would have fallen back to
Tailwind's default with no error anywhere. Two plans apart, and the earlier decision is
what makes the later one safe.

## A correction to plan 005's record

Plan 005's synthesis says flatly "Tailwind scans comments." Too broad. A found, and I
verified:

    `duration-500` appears 3x in comments in src/index.css
    `.duration-500` emitted: False

**CSS comments in the entry stylesheet are not scanned.** TypeScript and TSX comments are -
demonstrated in plan 005, where removing a literal from a comment in
`src/lib/overlay-motion.ts` took the invalid origin rules from 1 to 0.

The accurate rule: Tailwind scans source files including their comments, plus markdown. It
does not scan the CSS it is compiling. Worth stating precisely, because "never write class
names in comments" is the wrong lesson for `.css` and the right one for `.tsx`.

## Verified in a browser

C, on the production build via `vite preview`: screenshots identical across five views at
1440 / 1024 / 390 in both themes; interactive states exercised for real (dropdown open with
a live `transform-origin: 224px 106px`, not `center`); frame-sampled motion showing
accordion 20 open / 11 close, dropdown 11, button press 7 distinct values.

Confirmed by me on the shipped rescope, since C had verified the deny-list:

    accordion open   16 distinct frames
    accordion close  11 distinct frames
    wrapper transition-property: grid-template-rows, visibility

## C's documented dead end, worth keeping

C chased a false "flex-shrink-0 disappeared" regression for a while. Tailwind merges
classes with identical declarations into one grouped selector
(`.flex-shrink-0,.shrink-0{flex-shrink:0}`), and C's first grep pattern did not allow for
the leading comma. A proper parser showed the rule present in both builds.

That is the fourth instrument error recorded in this audit, after three of my own. The
plan's own verification step said "diff the emitted rule sets" without specifying that
naive grep is unsafe against comma-grouped selectors. Corrected.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
Bundle 74,088 -> 68,793 bytes.
