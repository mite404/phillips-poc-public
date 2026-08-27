# Arena synthesis - plan 014, keyboard traps

Two sonnet candidates. Base: **A**, extended past the plan's scope because the sweep found
five more instances and there are no new tickets to file them into.

| | Lens | Outcome |
| --- | --- | --- |
| A | Native semantics, minimum machinery | **Base**. Found the suppressed ring and the Card instances |
| B | The popover's focus management end to end | Confirmed the container was never the problem |

## The fix would have been invisible

A found that the option row's className carried `outline-none`, inherited from the sibling
Radix-menu class strings elsewhere in the file. Tailwind utilities beat `@layer base`
regardless of source order, so plan 010's `*:focus-visible` fallback ring would have been
suppressed **on exactly the controls this plan makes focusable**.

Verified: B's version still carries it, A's does not. Swapping `div` for `button` alone
passes every keyboard test - Tab reaches it, Enter and Space activate it - while showing no
focus indicator at all. Another fix that works and cannot be seen.

## The container was never broken

B established this and it is worth recording, because it narrows the defect. Before the
fix, Escape already closed the popover and returned focus to the trigger correctly. Radix's
focus management was fine. Focus landed on the dialog wrapper only because **nothing inside
was focusable**, and Tab did nothing for the same reason.

So the bug was precisely the missing semantics on the options, not the popover.

B also correctly classified a behaviour as a non-defect: Tab from the last item loops back
rather than escaping to the next toolbar control. That is Radix `Popover.Content`'s trapped
`FocusScope`, and Escape is the documented exit per WAI-ARIA APG.

## ARIA: `role="checkbox"` over `aria-pressed`

Both candidates rejected `role="option"` for the same correct reason - it is only valid
inside a `listbox`, `tree`, `grid` or `combobox`, and there is no such container here, so an
orphaned `option` role is invalid markup.

They then split. B chose `aria-pressed` (toggle-button pattern); A chose `role="checkbox"` +
`aria-checked`. Took A's, because A verified what a screen reader actually receives rather
than reasoning about it - Chrome's accessibility snapshot reports
`checkbox "Incomplete" checked`. That also matches the checkbox glyph already in the markup.

## Three sweeps, three answers

The plan told candidates to run `grep -rn "onClick" src/ | grep -i div`. That returns **zero
hits**, including on the file being fixed, because this codebase puts each JSX attribute on
its own line and a line-oriented grep cannot span them. A caught this and swept manually
instead. My own first attempt made the identical mistake.

My second attempt used a multiline-aware regex over literal tags and found **one** - the
line the plan targets.

A read every `onClick` by hand and found **six**: the facet filter, plus five
`<Card onClick>` sites in `ProgramBuilder.tsx`, `ProgramManager.tsx`, `StudentDashboard.tsx`
(x2) and `CourseCard.tsx`.

`Card` renders a plain `<div>` (`ui/card.tsx:49`), so `<Card onClick>` is a `<div onClick>`
wearing a component name. No regex over source text can know that without resolving what the
component renders. That is the limit of pattern-matching for this question, and it is why
five keyboard traps sat in this codebase behind a name.

## Extended past the plan

A left the five Card instances unfixed, matching this audit's convention of filing new
findings as a separate plan. The user has since said no more tickets, so they are fixed here
instead - same defect class, same plan.

The wiring went into `Card` itself rather than the five call sites, following plan 011's
lesson: put the guard where a call site cannot get it wrong. A `Card` with `onClick` now
gets `role="button"`, `tabIndex={0}` and an Enter/Space handler; a `Card` without one is
untouched and stays out of the tab order.

Two details in that handler:

- Space scrolls the page by default on a non-button, and Enter does not activate a div at
  all, so both need explicit wiring and `preventDefault`.
- The handler checks `e.target === e.currentTarget`, so a key press on a control *inside*
  the card does not also fire the card's own handler. These cards contain buttons.

## Verified by the parent

    clickable cards with role=button: 10, tabIndex 0
    non-clickable cards:              tabIndex -1 (unchanged)
    Enter -> opens the correct modal: true
    Space -> opens the correct modal: true

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests,
including all 6 in `StudentProgressView.test.tsx`.
