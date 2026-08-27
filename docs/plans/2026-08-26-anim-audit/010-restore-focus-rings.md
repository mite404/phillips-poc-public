# 010 - Restore focus indicators

Audit commit `7fdde76`. Depends on: nothing. **Highest-severity accessibility issue found
in this audit.**

## Context

Found by an arena candidate while testing keyboard navigation on the accordion.
`src/index.css:378-386`, inside `@layer base`:

```css
/* FORCE REMOVE ALL BLUE FOCUS RINGS */
*,
*:focus,
*:focus-visible {
  outline: none !important;
  --tw-ring-offset-width: 0px !important;
  --tw-ring-shadow: 0 0 #0000 !important;
}
```

This removes every focus indicator in the application. Not the default blue ring the
comment refers to - all of them. `outline` covers the browser default, and zeroing
`--tw-ring-shadow` defeats Tailwind's ring utilities too, so the components that
correctly ask for a focus style get nothing:

- `ui/button-variants.ts:4` - `focus-visible:ring-1 focus-visible:ring-ring`
- `ui/input.tsx:11` - `focus-visible:ring-1 focus-visible:ring-ring`
- `ui/sidebar-menu-button-variants.ts:4` - `focus-visible:ring-2`
- `ui/dialog.tsx:45`, `ui/sheet.tsx:65` - close buttons
- every Radix trigger in the app

A keyboard user cannot tell where they are, anywhere. This is a **WCAG 2.1 Level AA
failure, 2.4.7 Focus Visible**, and it is not a subjective polish call.

The intent is legible from the comment: someone disliked the default blue ring. That is a
reasonable thing to want. The fix is to restyle the ring on brand, not to delete focus.

## Target

Remove the blanket rule. Replace it with a branded `:focus-visible` style using tokens
that already exist.

- `--ring` is already defined in `src/index.css` as `#ff5000`, the Phillips accent, and is
  already mapped into `@theme` as `--color-ring`.
- Use `:focus-visible` only, never `:focus`, so a mouse click does not show a ring while
  keyboard navigation does. That distinction is what the original author was probably
  reaching for.
- `outline: 2px solid var(--ring); outline-offset: 2px;` is the cheapest correct
  implementation and does not disturb layout.

## Steps

1. Delete the blanket rule at `src/index.css:378-386`.
2. Add a single branded `*:focus-visible` rule in the same `@layer base`.
3. Verify the components listed above now show a ring. Their existing
   `focus-visible:ring-*` utilities may now double up with the base outline; if so, prefer
   the base rule and leave the utilities in place, or verify they render as one coherent
   indicator rather than two.
4. Check contrast of the ring against every background it lands on: `--background`
   `#ffffff`, `--card-background` `#fafafa`, `--sidebar` `#fafafa`, `--muted` `#f5f5f5`,
   and the dark-mode equivalents. WCAG 1.4.11 wants 3:1 for a focus indicator.
5. Check the ring is not clipped by any `overflow: hidden` ancestor, particularly inside
   the accordion panel that plan 002 introduced.

## Scope boundaries

- Do not change any component's own `focus-visible:` utilities in this plan.
- Do not add a focus style to non-interactive elements.
- This is not an animation plan. Do not animate the ring.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Tab through the entire app with the mouse untouched: auth portal, sidebar, program
   builder, the progress table, both accordions, and every modal. Every stop must show a
   visible indicator.
3. Click the same controls with a mouse. No ring should appear.
4. Screenshot the ring on light and dark backgrounds; verify 3:1 contrast.
5. `grep -rn "outline: none" src/` returns nothing outside a justified, commented case.
