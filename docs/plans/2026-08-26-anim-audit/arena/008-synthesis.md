# Arena synthesis - plan 008, starter cleanup

Three sonnet candidates. Base: **B**, narrowed with **C**'s judgment. All three
independently refuted the plan's central premise.

| | Lens | Outcome |
| --- | --- | --- |
| A | Visual regression, screenshots | Found a mobile regression the others missed |
| B | Completeness, grep-prove every deletion | **Base**. Found a rule the plan did not list |
| C | Measure the `#root` fix | Traced the real cause; narrowed the button fix |

## The plan's premise was wrong

Plan 008 claimed `App.css`'s `#root { max-width: 1280px; margin: 0 auto }` was what pushed
the main grid under the sidebar and clipped the Student view's program titles. That claim
came from a screenshot taken during plan 002's arena, and I filed it without tracing it.

All three candidates measured it. Deleting `#root` does **not** fix the clipping - it makes
it about 32px **worse**, because `#root`'s stale padding was masking part of the gap. Two
bugs were cancelling out.

The real cause, found independently by all three: `ui/sidebar.tsx` uses
`w-[--sidebar-width]`, the Tailwind **v3** bracket form. v4 emits `width:--sidebar-width`
with no `var()`, which browsers drop, so the sidebar's flex spacer collapses to zero and
the layout never reserves its width. Confirmed live by A, which patched
`element.style.width = 'var(--sidebar-width)'` in the console and watched the overlap
disappear.

Measured on the shipped result at 1440x900, Student view:

    sidebar:  x=0  width=240  right=240
    title 1:  left=113   -> still underneath the sidebar
    title 2:  left=113   -> still underneath the sidebar

**Plan 008 does not fix the clipped titles.** Filed as
[plan 013](../013-tailwind-v3-bracket-syntax.md), which sweeps all 23 instances of that
syntax across 12 files. It is the fifth occurrence of the same v3-to-v4 gap in this audit.

## Two regressions the plan would have caused

**1. Every button would have lost its cursor.** B and C both caught this. The plan says to
delete the starter `button` rule wholesale. But Tailwind v4's preflight mentions `cursor`
only in a comment about Safari spin buttons - it never sets `cursor: pointer` - and
`button-variants.ts` carries zero `cursor-` classes. Verified: before `pointer`, after
`default`, on every button in the app.

B refused the deletion outright; C deleted and restored the one property. Shipped C's
shape, since `border-radius` and `font-family` genuinely are redundant with preflight and
only `cursor` is load-bearing.

**2. A mobile header clip.** A measured that removing `#root`'s `padding: 2rem` shifts
content up 32px at 390px, taking `h1.top` from `7.19px` to `-24.8px` and clipping the
header on every authenticated view.

That regression is real *only if* you delete `App.css` without also deleting the `h1` rule
below - which is exactly what the plan scoped. B deleted both, which resolves it. Verified
on the shipped result: `h1FontSize: 24px`, one line, `h1Top: 15.5`, not clipped.

## What B found that the plan did not list

`src/index.css:158` carried a stock Vite `h1 { font-size: 3.2em; line-height: 1.1 }`.
Unlayered, so it outranks every Tailwind heading utility regardless of specificity.
Confirmed in built CSS: the rule sits at byte 69,346, past `@layer utilities` at 8,782.

**Every `<h1>` in the app was rendering at 51.2px** irrespective of the `text-2xl` /
`text-3xl` on it. That is a real visible bug the plan missed entirely, and it is the same
mechanism - unlayered CSS in `index.css` beating Tailwind - that has now produced four
separate defects in this audit: the dead accordion keyframes, the overridden button
transition in plan 003, this `h1`, and the focus rings plan 010 still has to fix.

## Filed, not fixed

- `components.json` still points `tailwind.config` at the deleted file. shadcn CLI
  metadata only, outside build/lint/test, but it will bite the next `shadcn add`.
- The sidebar overlap itself, now plan 013.

## Result

Deleted: `src/App.css` and its import, `tailwind.config.js`, and from `src/index.css` the
`h1` override, the `a`/`a:hover` Vite-purple link colours, and `button:hover`. Kept
`button { cursor: pointer }` with a comment saying why it is not cruft.

CSS bundle 74,512 -> 73,861 bytes. `grep -rn "646cff\|535bf2"` returns nothing anywhere.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.

One limitation: the 390px verification ran at an effective 500px viewport, the narrowest
the browser window would go. The header measures 24px and renders on one line there, and
the string is far too short to wrap at 390px at that size, but it was not confirmed at
exactly 390.
