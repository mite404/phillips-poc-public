# 005 - Overlays: keyframes to interruptible transitions

Audit commit `7fdde76`. Depends on: 001. Read `MOTION-CONTRACT.md` first.

## Context

Every overlay in the app animates with `@keyframes`, via `tailwindcss-animate`'s
`animate-in` / `animate-out` utilities. Keyframes restart from frame zero on re-trigger.
Transitions retarget from wherever the element currently is. So a dropdown toggled twice
in quick succession visibly jumps back to its start position instead of reversing.

There is a second problem underneath: `tailwindcss-animate@1.0.7` is a Tailwind **v3**
plugin, declared in `devDependencies` and loaded via `@plugin "tailwindcss-animate"` at
`src/index.css:5`. Plan 002 already established that this plugin is not the source of the
accordion keyframes. Determine as part of this plan whether the plugin's utilities are
actually emitting under Tailwind v4 here, and say so in the rationale with evidence from
built CSS rather than from assumption.

## Files and current state

| File:line | Element | Current |
| --- | --- | --- |
| `ui/dialog.tsx:22` | modal overlay | `data-[state=open]:animate-in ... fade-out-0 fade-in-0` |
| `ui/dialog.tsx:39` | modal content | `duration-200 ... zoom-in-95 slide-in-from-top-[48%]` |
| `ui/sheet.tsx:22` | sheet overlay | same fade pattern |
| `ui/sheet.tsx:32` | sheet content | `transition ease-in-out data-[state=open]:duration-500 data-[state=closed]:duration-300` |
| `ui/dropdown-menu.tsx:50,69` | menu + submenu | `zoom-in-95` + `slide-in-from-*` |
| `ui/popover.tsx:22` | popover | same |
| `ui/tooltip.tsx:23` | tooltip | `animate-in fade-in-0 zoom-in-95` |

`sheet.tsx:32` is a separate finding on its own: `ease-in-out` on an entering surface
contradicts contract rule 2, and this is the **mobile sidebar**, so it is the primary
navigation on small screens.

## Already correct - do not "fix"

- `dropdown-menu.tsx:50,69`, `popover.tsx:22`, `tooltip.tsx:23` all set
  `origin-[--radix-*-transform-origin]`. These already scale from their trigger, which is
  contract rule 3. **Preserve this.** Any approach that drops the Radix origin variable
  is a regression.
- `dialog.tsx:39` scales from center. Modals are the documented exception. Leave it.

## Target values

| Surface | Enter | Exit | Easing in / out |
| --- | --- | --- | --- |
| Tooltip | `--duration-pop` 240ms | `--duration-swap` 160ms | `--ease-out` / `--ease-exit` |
| Dropdown, popover | `--duration-pop` 240ms | `--duration-swap` 160ms | `--ease-out` / `--ease-exit` |
| Dialog | `--duration-surface` 320ms | ~190ms | `--ease-out` / `--ease-exit` |
| Sheet | `--duration-travel` 460ms | `--duration-surface` 320ms | `--ease-drawer` / `--ease-exit` |

Scale in from `--scale-in` (0.96). Never from `scale(0)`.

## Steps

1. Convert each overlay from `animate-in` / `animate-out` keyframes to CSS transitions
   driven by Radix's `data-[state]` attribute. Radix keeps the element mounted through
   its exit, which is what makes a pure-CSS exit possible here without `AnimatePresence`.
2. Apply the enter/exit duration split from the table. Exit at roughly 60% of enter.
3. Fix `sheet.tsx:32` easing: `--ease-drawer` entering, `--ease-exit` leaving.
4. Preserve every `origin-[--radix-*]` variable and every `data-[side=*]` directional
   offset. The tooltip that slides down from a top-anchored trigger must still slide
   down.

### Traps that will cost an hour each

- `@starting-style` must be declared **after** the open-state rule it seeds. Placed
  before, it is overridden and the enter silently does nothing.
- Top-layer elements need `overlay` **and** `display` in the transition list, both with
  `transition-behavior: allow-discrete`. Without `overlay`, the element drops out of the
  top layer immediately and its exit plays behind the rest of the page.
- Radix `data-[state]` overlays generally do not need `@starting-style` at all, because
  Radix mounts the element and then flips the attribute. Reach for `@starting-style` only
  where you can show it is actually required.

## Scope boundaries

- Do not change any overlay's positioning, sizing, focus trapping, or a11y attributes.
- Do not replace Radix with anything.
- Do not add `motion` / Framer. Plan 007 is the only one approved for that.
- Removing `@plugin "tailwindcss-animate"` is in scope **only** if nothing else still
  depends on it. Verify by grep, not by assumption; `animate-pulse` is Tailwind core, not
  the plugin.

## Arena rubric

1. Toggling a dropdown rapidly reverses smoothly instead of restarting.
2. Enter decelerates, exit accelerates, exit is visibly quicker than enter.
3. Trigger-anchored origins preserved on dropdown, popover, tooltip.
4. Directional `data-[side=*]` offsets still work on all four sides.
5. Sheet enters on `--ease-drawer`, not `ease-in-out`.
6. No overlay exit renders behind the page or disappears instantly.
7. The claim about `tailwindcss-animate` under v4 is backed by built-CSS evidence.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Feel-check every surface, since this plan touches five components:
   - Tooltip on the sidebar rail: hover on, hover off, hover a neighbour immediately.
   - Dropdown: open, close, and toggle four times fast.
   - Dialog: `CourseDetailModal` and `EnrollmentModal`, open and dismiss by Escape,
     backdrop click, and the close button.
   - Sheet: narrow the viewport below `md`, open the mobile sidebar, swipe it away.
   - Each of the four `data-[side]` positions, by scrolling a trigger near a viewport
     edge so Radix flips the side.
3. DevTools, slow animations to 25%, confirm every enter decelerates into its landing.
4. Reduced motion: overlays should crossfade in place, not slide.
