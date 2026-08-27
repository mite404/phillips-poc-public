# 014 - Facet filter options are not keyboard reachable

Audit commit `7fdde76`. Depends on: nothing. Found during plan 010.

## Context

Found by an arena candidate while tabbing the whole app to verify focus indicators. It is
a different and worse problem than a missing indicator: these controls cannot be reached
by keyboard at all, so there is nothing to indicate.

The "+Status" and "+Level" facet-filter popover options in
`src/components/progress/StudentProgressView.tsx` (around line 123) are plain
`<div onClick={...}>` with no keyboard semantics: no `tabIndex`, no `role`, no key
handler. A mouse user can filter the progress table; a keyboard user cannot.

This is a **WCAG 2.1 Level A failure, 2.1.1 Keyboard** - a stricter level than the focus
indicator issue plan 010 fixed, which was AA.

## Target

Make each option a real control. Options, in order of preference:

1. **Use a native `<button>`.** Cheapest and correct: focusable, activates on Enter and
   Space, announced as a button. The existing styles carry over.
2. **Use Radix's menu primitives.** These options live in a Popover. `@radix-ui/react-dropdown-menu`
   is already a dependency and its `DropdownMenuCheckboxItem` gives roving focus, type-ahead
   and correct ARIA for a multi-select filter. More change, better semantics.
3. **`role="option"` + `tabIndex` + key handlers** by hand. Do not do this. It is the most
   code and the easiest to get subtly wrong.

Prefer 1 unless the list is long enough that roving focus genuinely helps, in which case 2.

## Steps

1. Convert the option rows. Keep the existing visual styling exactly.
2. Verify Enter and Space both activate, since a `div` handler often only listens for click
   and `<button>` gives both for free.
3. Confirm the focus indicator from plan 010 shows on each option and is not clipped by the
   popover's own overflow.
4. Sweep for the same pattern elsewhere: `grep -rn "onClick" src/ | grep -i "div"` and judge
   each hit. Any other clickable non-button is the same bug.
5. Check the popover's own focus management still works: opening it should move focus in,
   Escape should close and restore focus to the trigger.

## Scope boundaries

- Do not change the filtering logic or the table.
- Do not restyle. This is a semantics fix, not a visual one.

## Arena rubric

1. Every facet option is reachable by Tab and activates on both Enter and Space.
2. Screen-reader semantics are correct: each option announces its role and its
   checked/unchecked state.
3. The plan 010 focus indicator is visible on each option and unclipped.
4. Escape closes the popover and returns focus to the trigger.
5. The codebase-wide sweep for other clickable non-buttons is done, with each hit either
   fixed or explicitly judged safe.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Tab to the "+Status" trigger, open it, Tab through every option, toggle two with Enter
   and two with Space, Escape out. The table must filter identically to mouse use.
3. `StudentProgressView.test.tsx` stays green.
