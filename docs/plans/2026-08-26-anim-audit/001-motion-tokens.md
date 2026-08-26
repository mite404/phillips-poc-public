# 001 - Motion token scale and global reduced-motion

Audit commit `7fdde76`. Depends on: nothing. **Every other plan depends on this one.**
Read `MOTION-CONTRACT.md` first.

## Context

This app has no motion vocabulary. There is no `--ease-*` token, no `--duration-*` token,
and no `prefers-reduced-motion` block anywhere in the repository. Every transition in the
codebase is a bare Tailwind utility (`transition-colors`) running at the stock 150ms on
Tailwind's default curve. Nothing can be retuned globally, and motion-sensitive users get
the full set of slides, scales, and pulses.

This plan installs the vocabulary. It changes almost nothing visually on its own. It
exists so plans 002-007 have tokens to consume.

## Files

- `src/index.css` - the only file this plan modifies.

Current state: `@theme inline` at line 155 defines colors, fonts, and radii only. The
`:root` block at line 8 holds raw brand and theme values. There is no animation-related
declaration in the file.

## Target values

Copy these exactly from `MOTION-CONTRACT.md`. Do not approximate a cubic-bezier.

```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)
--ease-exit:   cubic-bezier(0.4, 0, 1, 1)

--duration-micro: 100ms   --duration-swap: 160ms    --duration-pop: 240ms
--duration-surface: 320ms --duration-travel: 460ms  --duration-stagger: 45ms

--travel-sm: 4px  --travel-md: 8px  --travel-lg: 16px
--scale-in: 0.96  --scale-press: 0.97
```

## Steps

1. Add the easing tokens to the existing `@theme inline` block in `src/index.css`. This
   is the Tailwind v4 `--ease-*` namespace, so each one generates a utility: `ease-out`,
   `ease-in-out`, `ease-drawer`, `ease-exit`.

   Note this **overrides Tailwind's stock `ease-out` and `ease-in-out`**. That is
   intended - it upgrades every existing use in the codebase to the strong curve in one
   edit. Call the override out in a comment so the next reader is not surprised.

2. Add the duration, travel, and scale tokens. Tailwind v4 has **no `--duration-*` theme
   namespace**, so these cannot go in `@theme` and generate utilities. Put them in
   `:root` and consume them as `duration-(--duration-pop)`.

3. Add one global `prefers-reduced-motion: reduce` block. It must:
   - Collapse durations to a short crossfade, not to zero.
   - Zero out travel and scale tokens so transforms resolve to no movement.
   - **Not** use `transition: none` or `animation: none`, which would destroy the
     state-change signal that motion carries.
   - Cover `animation-duration`, `transition-duration`, and `scroll-behavior`.

4. Leave every existing declaration in the file alone. This plan adds; it does not
   refactor.

## Scope boundaries

- Do not touch any component file. Consuming the tokens is plans 002-007.
- Do not delete the Vite starter CSS at `src/index.css:135-152`. That is plan 008.
- Do not add a dependency.

## Arena rubric

1. Easing tokens land in `@theme inline` and generate working Tailwind utilities; the
   exact cubic-bezier values match the contract character for character.
2. Duration tokens are reachable from Tailwind without inventing a fake `@theme`
   namespace that silently produces nothing.
3. The reduced-motion block reduces movement while preserving a visible state change.
   A candidate that writes `transition: none` fails this criterion outright.
4. The Tailwind `ease-out` override is deliberate and documented, not accidental.
5. Diff is additive. No unrelated reformatting of `index.css`.

## Verification

1. `bun run build` passes.
2. Add a scratch element using `ease-drawer` and `duration-(--duration-surface)`, run
   `bun run build`, and confirm the generated CSS contains
   `cubic-bezier(0.23,1,0.32,1)` and `320ms`. Remove the scratch element.
   This is the check that catches a token defined in a namespace Tailwind ignores -
   the failure mode is silent, since Tailwind does not error on unknown utilities.
3. `bun run lint` and `bun run test` stay green.
4. Feel-check: none yet. This plan is invisible by design.
