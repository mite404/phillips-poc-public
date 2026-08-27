# 013 - Fix 23 Tailwind v3 bracket-syntax class names

Audit commit `7fdde76`. Depends on: nothing. **Fixes a visible layout bug.**

## Context

Tailwind v3 read `prop-[--custom-property]` as an implicit `var()`. **Tailwind v4 does
not.** It emits the bare property name with no `var()` - `width:--sidebar-width`,
`border-radius:--radius` - which is invalid CSS and every browser silently drops.

This repo is on Tailwind v4 with vendored shadcn components written for v3. The result is
23 broken class names across 12 files:

```
16 x  rounded-[--radius]           every "rounded" corner in the app
 4 x  w-[--sidebar-width]          the sidebar's own width
 2 x  w-[--sidebar-width-icon]
 1 x  max-w-[--skeleton-width]
```

This is the fifth distinct instance of the same v3-to-v4 gap found during this audit.
Plan 005 fixed three of them (`origin-[--radix-*]`, which meant every dropdown, popover
and tooltip scaled from its own centre rather than its trigger). These 23 remain.

## The visible symptom

`w-[--sidebar-width]` produces no width, so the sidebar's flex spacer collapses to zero
and the layout never reserves the sidebar's 256px. The fixed sidebar panel then overlaps
the content beneath it. Measured at 1440x900 in the Student view:

```
sidebar:  x=0  width=240  right=240
title 1:  left=113   -> underneath the sidebar
title 2:  left=113   -> underneath the sidebar
```

Which is why "Q3 Safety Ramp-up" renders as "fety Ramp-up".

**Plan 008's premise was wrong about this.** It claimed `App.css`'s
`#root { max-width: 1280px }` was the cause. Three independent arena candidates measured
it and found the opposite: `#root`'s stale padding was *masking* part of the gap, so
deleting it makes the clipping about 32px worse. Two bugs were cancelling out.

`rounded-[--radius]` is less dramatic but affects 16 sites: `--radius` is `0rem` in this
theme, so the intended value happens to match the browser default of no rounding. The
class is still dead, and it will produce a silent visual change the moment anyone sets a
non-zero radius.

## Target

Replace the bracket form with the v4 parenthesis form throughout:

```
rounded-[--radius]        ->  rounded-(--radius)
w-[--sidebar-width]       ->  w-(--sidebar-width)
w-[--sidebar-width-icon]  ->  w-(--sidebar-width-icon)
max-w-[--skeleton-width]  ->  max-w-(--skeleton-width)
```

The equivalent `prop-[var(--foo)]` also works and is more explicit; pick one and be
consistent. Note `max-w-[--skeleton-width]` at `ui/sidebar.tsx:624` reads a variable set
inline by `SidebarMenuSkeleton`; confirm the rename keeps that wiring intact.

## Steps

1. Sweep every instance. `grep -rno '\b[a-z-]*-\[--[a-z-]*\]' src/` finds them all.
2. Convert each. This is mechanical, but verify the emitted CSS rather than trusting it.
3. **Prove each one now emits a real `var()`.** Build and grep the output for
   `width:var(--sidebar-width)` and `border-radius:var(--radius)`. A rule whose body is
   the bare property name is still broken.
4. Re-measure the sidebar overlap. The titles should no longer sit under the sidebar.
5. Add a lint guard if one is cheap, so the bracket form cannot come back. An ESLint rule
   over JSX class strings, or a grep in CI, is enough. This has recurred five times.

## Scope boundaries

- Do not restructure the sidebar or change its width values.
- Do not change `--radius` from `0rem`.
- Do not touch the plan documents' prose, which contains these strings as examples.
  Tailwind scans markdown, which is plan 009's problem, not this one.

## Arena rubric

1. Zero bracket-form custom-property class names left in `src/`.
2. Every converted class emits a real `var()` in the built CSS. Proven by grep, not
   asserted.
3. The sidebar reserves its width and the Student view's program titles are no longer
   clipped. Measured with `getBoundingClientRect()` before and after.
4. No visual regression at 1440 / 1024 / 390, light and dark. `--radius` is `0rem`, so
   corners should look identical; if anything changes, that is a finding.
5. A guard exists against reintroduction, or the rationale explains why one is not worth it.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. `grep -rn '\-\[--' src/` returns nothing.
3. Built CSS contains `width:var(--sidebar-width)`; no rule body is a bare `--` name.
4. Sidebar right edge <= main content left edge at 1440 and 1024.
5. Screenshots at three widths, both themes, before and after.
