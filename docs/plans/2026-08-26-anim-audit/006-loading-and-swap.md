# 006 - Loading, in-place swaps, and list stagger

Audit commit `7fdde76`. Depends on: 001. Read `MOTION-CONTRACT.md` first.

## Context

Three related gaps, all about content arriving or changing in place.

**Skeletons hard-cut.** Four components render `<Skeleton>` while `isLoading`, then
replace it with real content in the same frame: `MetricCard.tsx:20`,
`RosterList.tsx:173`, `ProgramBuilder.tsx:195`, `ProgramManager.tsx:118`. The swap is
instant and jarring.

**One component does not use `<Skeleton>` at all.**
`src/components/progress/StudentProgressView.tsx:466-469` hand-rolls its loading state:

```tsx
<div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
<div className="h-64 bg-slate-100 rounded animate-pulse"></div>
```

That hardcodes slate against a theme that defines `--muted`, so it does not follow dark
mode, and it duplicates a component that already exists at `src/components/ui/skeleton.tsx`
and is used correctly in the four files above.

**The theme toggle icon hard-cuts.** `src/components/layout/SiteHeader.tsx:26-30`
swaps `<Moon>` for `<Sun>` with a ternary. No transition.

**Lists paint all at once.** The course grids in `ProgramBuilder.tsx` and
`ProgramManager.tsx`, and the roster in `RosterList.tsx`, have no stagger.

## Files

- `src/components/progress/StudentProgressView.tsx:462-473`
- `src/components/ui/skeleton.tsx`
- `src/components/layout/SiteHeader.tsx:22-32`
- `src/components/MetricCard.tsx`, `RosterList.tsx`, `ProgramBuilder.tsx`,
  `ProgramManager.tsx` - loading branches

## Target values

- Skeleton to content crossfade: `--duration-swap` (160ms), `--ease-out`.
- Icon swap: `--duration-swap` (160ms), `--ease-out`, cross-rotating or cross-fading in
  a single grid cell so the header does not reflow.
- Stagger: `--duration-stagger` (45ms) per item, **capped at 8 items**. Beyond that the
  last item arrives late enough to read as a bug rather than as rhythm.
- Stagger must never delay interactivity. Items are clickable from frame one.

## Steps

1. Replace the hand-rolled skeletons in `StudentProgressView.tsx` with the existing
   `<Skeleton>` component. Match the current dimensions (`h-8 w-64`, two `h-64` blocks).
2. Add a crossfade between the loading and loaded states. Consider whether this belongs
   in each of the five call sites or in one shared place. There is no existing wrapper
   for this; if you add one, it needs to earn its file.
3. Animate the theme-toggle icon swap in `SiteHeader.tsx`. Both icons occupy one slot,
   so they must be stacked rather than laid out sequentially, or the header will jump.
4. Add stagger to the card grids. Pure CSS via `--duration-stagger * index` on
   `transition-delay` or `animation-delay`. Decide whether the index comes from an
   inline style or from `nth-child`, and note the tradeoff: `nth-child` needs no JS but
   cannot exceed a fixed count.
5. Confirm stagger does not re-fire on re-render. A list that re-staggers every time a
   filter changes is worse than no stagger at all - this is the main risk in this plan.

## Scope boundaries

- Do not change loading logic, `isLoading` state, or any fetch.
- Do not add stagger to the progress table in `StudentProgressView.tsx`. It sorts and
  filters constantly, and re-staggering on every sort is exactly the failure above.
- Do not add a dependency.

## Arena rubric

1. `StudentProgressView` uses `<Skeleton>`; no `bg-slate-*` remains in its loading state,
   and the loading state follows dark mode.
2. Content fades in rather than snapping when `isLoading` flips.
3. Icon swap does not shift the header layout by even a pixel.
4. Stagger is capped, and the cap is visible in the code rather than implicit.
5. Stagger fires on first paint only, not on every re-render or filter change.
6. Nothing is unclickable while animating.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass. `StudentProgressView.test.tsx`
   exists and must stay green.
2. Feel-check:
   - Throttle the network to Slow 3G, reload the supervisor dashboard, watch the
     skeleton-to-content handoff on the metric cards.
   - Load the progress view and confirm its skeleton is themed, in both light and dark.
   - Click the theme toggle repeatedly. The icon should cross-swap with no layout jump.
   - Load a program with 12+ courses. Confirm the stagger caps and the 12th card does
     not arrive noticeably late.
   - Change a filter on a staggered grid. It must not re-stagger.
   - Reduced motion: crossfades stay, travel goes.
