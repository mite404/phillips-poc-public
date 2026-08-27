/**
 * Shared enter/exit motion for Radix "popper" content anchored to a trigger:
 * dropdown menu, submenu, popover, tooltip. All four share contract rows
 * "Dropdown, popover" and "Tooltip" - pop (240ms) in, swap (160ms) out,
 * `--ease-out` / `--ease-exit` - and each call site already carries its own
 * its own Radix transform-origin utility, so this string deliberately leaves
 * `origin-*` out and lets the call site keep scaling from its trigger.
 *
 * Those call sites use the parenthesis form of the arbitrary-value syntax.
 * Tailwind v3 read the square-bracket form as an implicit `var()`; v4 does
 * not, and emits a bare `transform-origin: --radix-...` with no `var()`,
 * which the browser drops. Every dropdown, popover and tooltip in this app
 * was silently scaling from its own centre until that was corrected. The
 * broken form is deliberately not spelled out anywhere in this repo:
 * Tailwind scans comments too, so writing it even as an example emits the
 * dead rule straight back into the bundle.
 *
 * Radix's Presence only defers unmounting an exiting node while a real CSS
 * *animation* is running (`@radix-ui/react-presence` reads
 * `getComputedStyle(node).animationName`, never `transition`). This motion
 * uses `transition` instead of `tailwindcss-animate`'s keyframes so a fast
 * re-open retargets instead of restarting from frame zero - so `exit-gate`
 * (defined in `index.css`) rides alongside on `data-[state=closed]` purely to
 * hold Presence open for `--duration-swap`, with no visual effect of its own.
 *
 * No directional `translate` here, deliberately - see the rationale doc for
 * the measured reason. Short version: Radix's floating-ui inserts this
 * content with a *guessed* `data-side` (there's no room measurement yet) and
 * corrects it a couple of milliseconds later once it has measured the
 * viewport; `@starting-style` only ever sees the value at the very first
 * paint, so a `starting:data-[side=X]:translate-*` rule binds to whichever
 * side was guessed, not the one the content actually lands on. Confirmed
 * with a `MutationObserver` on a real trigger: `data-side` was `"bottom"` at
 * insertion and flipped to `"top"` 2ms later, so a translate keyed to
 * `data-side` played the wrong direction on every flipped placement - which
 * is exactly the case rubric item 4 asks to test. `transform-origin` doesn't
 * have this problem: it's a plain custom property Radix keeps live for as
 * long as the element exists, read fresh on every frame rather than
 * captured once, so scaling from `--scale-in` around the origin the call
 * site already sets still reads as "grows from the trigger" correctly on
 * all four sides, flipped or not.
 */
export const POPPER_MOTION_CLASS =
  "opacity-100 scale-100 transition-[opacity,scale] duration-(--duration-pop) ease-out " +
  "starting:opacity-0 starting:scale-(--scale-in) " +
  "data-[state=closed]:opacity-0 data-[state=closed]:scale-(--scale-in) " +
  "data-[state=closed]:duration-(--duration-swap) data-[state=closed]:ease-exit " +
  "data-[state=closed]:[animation:exit-gate_var(--duration-swap)_linear]"
