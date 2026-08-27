# Arena synthesis - plan 003, kill `transition-all`

Three sonnet candidates, distinct lenses. Base: **B**, with mandatory grafts from A and C.

| | Lens | Outcome |
| --- | --- | --- |
| A | Property precision - name exactly what changes | Grafted from. Only candidate correct on the sidebar |
| B | Duplication - extract or not | **Base**. Best structure, one regression |
| C | Browser verification - prove "no visual change" | Grafted from. Only real browser evidence |

No cross-judge. The three disagreed on separable questions with empirically decidable
answers, so measurement settled each one directly.

## The honest headline: three of the six sites are on dead components

Candidate C checked whether the components actually render. They largely do not:

| Site | Live? |
| --- | --- |
| `CourseCard.tsx` hover | Yes |
| `ProgramBuilder.tsx` card hover | Yes |
| `ProgramManager.tsx` card hover | Yes |
| `ProgramBuilder.tsx` filter chip | Yes, but the fix was **inert** - see below |
| `ui/progress.tsx` | **No live consumer.** Only referenced from a `.old.tsx` dead file |
| `ui/sidebar.tsx` rail | **Never rendered.** Zero JSX usages of `<SidebarRail>` |

Both are still fixed, because they are correct fixes for whenever those components are
used. But this plan's user-visible effect comes from four sites, not six, and the record
should say so rather than imply six things improved.

## The fix that did nothing until an unrelated line was deleted

C found that `src/index.css:169-173` carried a leftover from the Vite starter template:

```css
button {
  border-radius: var(--radius);
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s;   /* <- this line */
}
```

That rule is **unlayered**. Tailwind emits utilities into `@layer utilities`, and an
unlayered rule beats a layered one regardless of specificity - the same cascade mechanic
plan 001 used deliberately for reduced motion. So this stray declaration silently
overrode `transition-colors` on **every button in the application**, including the filter
chip this very plan was fixing.

Verified in the browser before and after. Filter chip computed style now:

    transition-property: color, background-color, border-color, ...
    transition-duration: 0.1s
    timing-function:     cubic-bezier(0.23, 1, 0.32, 1)

Before, it was `border-color` / `0.25s` / `ease`.

The single `transition:` line was removed here rather than left to plan 008, because plan
003 is the animation-cleanup plan and shipping a fix that provably does nothing is not
shipping a fix. Plan 008 still owns the rest of that block.

## The rail hover has never worked, and `transition-all` was covering nothing

Candidate A established, and I confirmed against compiled CSS, that **zero** `::after`
rules in the entire bundle carry a `transition`. `transition` is not an inherited
property and does not reach a pseudo-element's own box, so `ui/sidebar.tsx`'s
`hover:after:bg-sidebar-border` has always been an instant flip.

This reframes the finding. The `transition-all` there was paying full cost - every
animatable property watched, off the compositor - to animate a property that was never on
the same box. Left un-animated deliberately: making it animate would be *adding* motion,
which this plan explicitly excludes.

## Why B is the base, and where B was wrong

**B's structure wins.** It extracted the shared card affordance as a plain exported
constant in `ui/card.tsx`:

```ts
export const cardInteractiveClasses =
  "hover:shadow-md transition-shadow duration-(--duration-micro) ease-out cursor-pointer";
```

B rejected `cva` (one on/off recipe is not a variant axis) and rejected adding an
`interactive` prop to `Card` (changes a shared primitive's interface for every consumer).
Both rejections are right. A declined to extract at all; C extracted into
`src/lib/utils.ts`, which is the generic `cn()` module and the wrong home for a
card-specific recipe.

The reason to extract at all: the point of a token scale is that one edit retunes the app.
Three hardcoded copies of the same timing partly defeat that.

B also fixed a seventh site it found adjacent to its work, `CourseCard.tsx:94`, where the
default variant had a bare `transition-colors` with no tokens.

**B's regression, grafted out.** B replaced the sidebar rail's `transition-all` with
`transition-colors`. That drops a real `transform` change: the rail carries
`-translate-x-1/2` and `group-data-[collapsible=offcanvas]:translate-x-0`, with
`data-collapsible` toggled at runtime (`sidebar.tsx:204`). A's
`transition-[transform,background-color]` is correct and was taken verbatim.

## The theme-toggle trap was real, and is now fixed

The plan warned that adding `transition-colors` to an element means it also animates
during a theme switch. C measured the **baseline** and found the opposite problem already
present: toggling the theme with a card hovered fired roughly **80 duplicated
`transitionrun` events**, some properties firing two or three times in the same
millisecond, because `transition-all` was watching everything.

Measured on the grafted result, same action:

    card transition-property: box-shadow
    duration:                 0.1s
    easing:                   cubic-bezier(0.23, 1, 0.32, 1)
    transitionrun events on theme toggle: 0

The card now animates one property, on the contract curve, and a theme switch does not
touch it at all.

## A plan correction

Plan 003 attributed the progress bar's `translateX` to Radix. Wrong: `ui/progress.tsx:20`
sets it as the component's own inline style, and `@radix-ui/react-progress` sets no style
on the Indicator. The fix (`transition-transform`) is unaffected. Corrected in the plan.

## Not verified

`prefers-reduced-motion` was not exercised end-to-end on this plan's transitions. C
attempted it and reported that the available browser-emulation tool has no such
parameter, verifying structurally instead. Plan 001's unlayered clamp reaches
`transition-duration` longhands, which is what these compile to, so the mechanism is
sound - but it has not been confirmed in a rendered frame here.

## Checks

`grep -rn "transition-all" src/` returns nothing. `bun run build` pass, `bun run lint`
exit 0, `bun run test --run` 4 files / 56 tests.
