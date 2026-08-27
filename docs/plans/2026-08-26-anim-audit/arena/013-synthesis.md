# Arena synthesis - plan 013, Tailwind v3 bracket syntax

Three sonnet candidates. Base: **B**, plus a regression fix the arena forced.

| | Lens | Outcome |
| --- | --- | --- |
| A | Measure the layout fix | Quantified the bug; found an unrelated theme defect |
| B | Stop it coming back | **Base**. Guard covers `.css`, which the alternative could not |
| C | What else changes when 23 dead declarations start working | Found a regression this plan causes |

## The fix, measured

All 23 instances converted: 16x `rounded-(--radius)`, 4x `w-(--sidebar-width)`,
2x `w-(--sidebar-width-icon)`, 1x `max-w-(--skeleton-width)`.

A measured before and after on the same running build using `git stash`/`stash pop`:

    1440x900 before:  sidebar right=241, titles left=113   128px underneath
    1440x900 after:   sidebar right=256, titles left=289   33px clear

Confirmed by me on the shipped result: `sidebarRight: 256`, all three program titles at
`left=289` or `861`, `underSidebar: false` on every one. "Q3 Safety Ramp-up" renders in
full rather than "fety Ramp-up".

## The guard is the point

This syntax gap has caused **five** separate defects in this repo: dead accordion
keyframes, tree-shaken easing tokens, every overlay scaling from its own centre, an
oversized `h1`, and this sidebar collapse. A one-time sweep does not prevent the sixth.

Both A and B built a guard. **B's wins because it covers `.css`**; A's used ESLint
`no-restricted-syntax`, which cannot parse stylesheets and would have needed stylelint as
a second dependency to close that gap. B's is a dependency-free Node script wired into
`bun run lint`, so CI picks it up with no workflow change.

It distinguishes the broken form from the two valid ones, and its message teaches the fix:

    Tailwind v4 does not read `prop-[--custom-property]` as var() - it emits the
    bare property name, which browsers silently drop. Use the parenthesis form
    instead: `prop-(--custom-property)`. Found:

      src/App.tsx:73  rounded-[--radius]  ->  rounded-(--radius)

Verified by me end to end: clean on the fixed tree, exit 1 on a reintroduced instance,
silent on the 13 doc mentions in the plan's own prose, and it does not flag
`prop-(--foo)` or `prop-[var(--foo)]`.

## C found a regression this plan causes, and it was right to look

C's assigned question was "what else changes when 23 dead declarations start working". The
answer was: one thing, badly.

`ProgramManager.tsx` lays out two **fixed** `lg:w-[550px]` columns. Once the sidebar
correctly reserves its 256px:

    viewport 1024 - sidebar 256          =  768px available
    two 550px columns + 24px gap         = 1124px needed
    shortfall                            =  356px

The `flex-1` column absorbed the entire shortfall, collapsing from 386px to 130px, and its
own `overflow-hidden` clipped student names, emails and the "Invite Selected" button
**with no scrollbar**. `document.body.scrollWidth === innerWidth` throughout, so this was
silent content loss, not page overflow anyone would notice.

C proved it was caused by this plan, not pre-existing, by stashing the fix and watching the
break disappear: the old overlap bug had incidentally been giving that row more width.

**Third instance in this audit of two bugs cancelling out.** Plan 008 found `#root`'s
padding masking part of the sidebar gap; plan 012 found error-swallowing masking a race.
The pattern is consistent enough to expect: a long-standing visual bug is often load-
bearing for something else.

C filed it as out of scope. I disagree and fixed it here - shipping silent content loss is
worse than the clipped titles this plan set out to fix, and it would have been *caused by*
this commit. The two-column layout moved from `lg:` to `xl:`, where the columns actually
fit, plus `min-w-0` so the flex child can shrink honestly rather than clipping.

Verified at both breakpoints on the shipped result:

    1024:  columns stack, 704px each, clipped: false, no page overflow
    1440:  side by side at 550 and 546px, clipped: false

## C's other proof

C confirmed the 16 `rounded-(--radius)` sites were pure no-ops today - `--radius` is
`0rem`, coincidentally matching the browser default - by checking all 16 for competing
radius classes and finding none. It then set `--radius: 0.75rem`, rebuilt, confirmed the
rule genuinely references the variable, and reverted. That is the difference between "the
fix compiles" and "the fix does something".

## Filed, not fixed

A found the theme toggle flips its icon while `documentElement` never gains the `dark`
class. Traced and confirmed **pre-existing**, not caused by plan 007 - the
`classList.toggle` call is byte-identical before and after that commit.

The real defect is that nothing applies the class on mount, so with no stored preference
the app believes it is dark while rendering light, and the **first click is a no-op** that
only changes the icon. Filed as [plan 015](../015-theme-never-applies-on-mount.md).

Worth noting A was the first candidate in fourteen plans instructed to verify *both*
themes, which is why fourteen plans went by without anyone finding it.

## Checks

`bun run build` pass, `bun run lint` exit 0 including the new guard, `bun run test --run`
4 files / 56 tests.
