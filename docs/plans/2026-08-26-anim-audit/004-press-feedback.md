# 004 - Press feedback on interactive controls

Audit commit `7fdde76`. Depends on: 001. Read `MOTION-CONTRACT.md` first.

## Context

Nothing in this app responds to a mousedown. `src/components/ui/button-variants.ts:4`
gives every button `transition-colors` and nothing else; the six variants at lines 9-16
each repeat `transition-colors` and change background only.

The result is that buttons feel like links. Press feedback is the single highest-leverage
missing animation here because it fires on literally every interaction, and because its
absence reads as unresponsiveness rather than as missing polish.

## Files

- `src/components/ui/button-variants.ts` - the `cva` base string at line 4 and the
  variant strings at lines 9-16.
- `src/components/ui/sidebar-menu-button-variants.ts:4` - sidebar nav items, the
  highest-frequency control in the app.
- `src/components/layout/SiteHeader.tsx:24` - the theme toggle, a raw `<button>`.
- `src/App.tsx:62,68` - the two auth-portal buttons, also raw `<button>`s.

## Target values

- Press: `scale(0.97)` on `:active`. Subtle. The contract's `--scale-press`.
- Duration: `--duration-micro` (100ms).
- Easing: `--ease-out`.
- **Asymmetric timing.** The press should register instantly and the release should
  settle. Symmetric press-and-release is an audit finding in its own right
  (`AUDIT.md` category 4).

## Steps

1. Add press feedback to the `cva` base in `button-variants.ts` so every variant inherits
   it, rather than repeating it six times.
2. Extend the existing `transition-colors` to include **`scale`**, not `transform`.
   Tailwind v4 compiles `scale-*` to the standalone `scale` property, and
   `transition-property: transform` does not animate it - verified, `transform` gives one
   distinct value over 200ms (a snap) where `scale` gives thirteen. Note contract rule 5:
   two rules both setting `transform` do not compose, the later wins outright. If
   anything else on a button already sets `transform`, use the individual `scale`
   property instead of the shorthand.
3. Gate any hover-paired motion behind `@media (hover: hover) and (pointer: fine)`.
   Touch devices fire a false hover on tap, which makes a hover-scale stick after the
   finger lifts. `:active` itself does not need the gate.
4. Decide the blast radius. Options the arena should weigh:
   - Base `cva` string only, so it reaches every `<Button>`.
   - Base plus the sidebar menu button, plus the four raw `<button>`s.
   - A global `button:active` rule in `index.css`, which reaches everything including
     Radix triggers but is harder to opt out of.
5. Confirm `disabled` buttons do not animate. `disabled:pointer-events-none` is already
   on the base string; verify it actually suppresses `:active`.

## Scope boundaries

- Do not change any button's colors, size, padding, or variant API.
- Do not add press feedback to non-interactive elements such as cards or table rows.
- Do not introduce a spring or any overshoot. The contract forbids visible bounce.

## Arena rubric

1. Every `<Button>` variant depresses on mousedown and settles on release.
2. The scale is subtle. Anything below 0.95 or above 0.99 fails.
3. Press registers instantly; release settles. Not symmetric.
4. Disabled buttons do not react.
5. Keyboard activation is not broken: `:active` fires on **Space** (at keyup). It does
   **not** fire on Enter for a native `<button>` in Chrome - Enter's activation runs as
   keydown's default action and the browser never renders a pressed state. Measured, not
   assumed. Focus rings cannot be checked until plan 010 lands.
6. No hover-scale that sticks after a tap on touch.
7. The rule is written once, not pasted into six variant strings.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Feel-check:
   - Press and hold a primary button. It should depress and stay depressed.
   - Tab to a button, hold Space. Same depression, focus ring still visible.
   - Press a disabled button. Nothing should move.
   - DevTools device emulation, tap a button. No stuck scale afterwards.
   - Reduced motion enabled: the button should still give feedback, via color if not
     via scale. Contract rule 6 - reduced, not removed.
