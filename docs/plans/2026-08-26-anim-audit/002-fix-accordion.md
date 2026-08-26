# 002 - Fix the dead accordion animation

Audit commit `7fdde76`. Depends on: 001. Read `MOTION-CONTRACT.md` first.

## Context

This is a bug, not a polish item. `src/components/ui/accordion.tsx:43` reads:

```tsx
className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
```

Those two keyframes **do not exist anywhere in this repository**:

- `tailwindcss-animate` does not ship them. It provides `animate-in` / `animate-out`,
  `fade-*`, `zoom-*`, and `slide-in-from-*`. The accordion keyframes are shadcn's own
  addition to `tailwind.config.js`, which the user is expected to paste in.
- `tailwind.config.js` here has no `keyframes` block at all, and its content globs point
  at `./pages/`, `./components/`, `./app/` - Next.js defaults, not this repo's `./src/`.
- That config is never loaded regardless. Tailwind v4 requires an explicit `@config`
  directive to read a JS config, and `src/index.css` has none.

Tailwind does not error on an unknown utility, so this failed silently. Every accordion
in the app snaps open and shut with no transition. The affected surfaces are the two
`Accordion.Root` usages in `src/components/student/StudentDashboard.tsx` (lines ~263 and
~370), which are among the most-used controls in the student view.

## Files

- `src/components/ui/accordion.tsx` - line 43 (content) and line 25 (trigger).
- `src/index.css` - if the chosen approach needs keyframes or an `--animate-*` token.
- `src/components/student/StudentDashboard.tsx` - verification surface only; the two
  `Accordion.Content` elements there must animate after the fix.

## Target values

- Duration: `--duration-surface` (320ms) opening, `--duration-swap` (160ms) closing.
  Exit at roughly 60% of enter, per contract rule 1.
- Easing: `--ease-out` opening, `--ease-exit` closing.
- The chevron at `accordion.tsx:31` already rotates on `duration-200`. Bring it onto the
  token scale so the chevron and the panel finish together rather than drifting apart.

## Steps

1. Pick an approach (this is the main thing the arena decides):
   - **Keyframes**: define `@keyframes accordion-down/up` plus `--animate-accordion-*`
     tokens in `@theme`, restoring what shadcn assumes. Uses Radix's
     `--radix-accordion-content-height` variable. Faithful to upstream shadcn.
   - **Grid collapse**: `grid-template-rows: 0fr -> 1fr` on a wrapper. A transition
     rather than a keyframe, so it retargets when toggled mid-motion instead of
     restarting from zero. Needs an inner `overflow: hidden` wrapper.
   - Whichever is chosen, state why in the rationale, and address interruptibility -
     contract rule 6 in `AUDIT.md` category 4: keyframes restart, transitions retarget.
2. Apply the fix and align the chevron timing.
3. `accordion.tsx:25` currently has `transition-all hover:underline`, which animates
   `text-decoration`. Narrow it to the properties actually being animated. (Plan 003
   owns the other five `transition-all` sites; this one is in the file you are already
   editing, so fix it here and note it so 003 does not collide.)

## Scope boundaries

- Do not restructure the accordion's API or its props.
- Do not touch `StudentDashboard.tsx` beyond what a wrapper element strictly requires.
- Do not delete `tailwind.config.js`. That is plan 008.
- Do not convert this component to Framer Motion.

## Arena rubric

1. The accordion actually animates. Verified in a browser, not asserted.
2. Opening decelerates and closing is meaningfully faster than opening.
3. Toggling rapidly mid-animation does not restart from zero or visibly jump.
4. The chevron and the panel finish together.
5. Height animates to intrinsic content height with no hardcoded pixel value and no
   clipping of the last row at any viewport width.
6. Works for both `Accordion.Content` usages in `StudentDashboard.tsx`.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` all pass.
2. Start the dev stack, sign in as Student, open the programs view:

   ```bash
   bunx concurrently "vite --port $PORT --strictPort" \
     "json-server --watch db.json --port $((PORT+1))"
   ```
3. Feel-check, and this is the one plan with an unambiguous before/after because the
   current behaviour is a hard snap:
   - Expand and collapse a program panel. It should glide, decelerating into place.
   - Click the same trigger four times fast. Watch for a restart-from-zero jump.
   - Expand a panel with many courses and one with few. Neither should clip.
   - DevTools, slow animations to 25%, confirm the curve decelerates rather than
     accelerates into the landing.
   - DevTools, Rendering, "Emulate prefers-reduced-motion: reduce". The panel should
     still change state visibly, with the movement reduced.
