# Arena synthesis - plan 011, dialog consumers unmount before their exit plays

Three sonnet candidates. Base: **C**, grafted with **A**. All three converged on the same
core mechanism and all three rejected the plan's literal wording.

| | Lens | Outcome |
| --- | --- | --- |
| A | What keeping the dialog mounted costs | Grafted from. Found two state leaks |
| B | Prove the exit plays on every path | Best frame table; content-presence check |
| C | Sweep for the pattern, pick a durable fix | **Base**. Found a third latent instance |

## The plan's Option 1 was wrong as written

I wrote: "render `<Dialog open={isOpen}>` unconditionally and let the component handle a
null `course` in its body rather than returning `null` above the `Dialog`."

All three candidates independently found that does not work. `course` and `isOpen` go
null/false in the **same render**, so guarding on the raw prop still blanks the subtree at
the exact moment Presence needs to begin the exit. The dialog would fade out empty.

The fix all three reached: latch the last non-null value using React's documented "adjust
state during render" pattern.

```tsx
const [displayCourse, setDisplayCourse] = useState(course);
if (course && course !== displayCourse) {
  setDisplayCourse(course);
}
```

Not a `useEffect` (too late, and a render behind) and not a ref - A tried a ref first and
this repo's `eslint-plugin-react-hooks` v7 ships the React Compiler's `react-hooks/refs`
rule, which rejected it with "Cannot access refs during render".

B made the sharpest observation about why this matters: frame-counting alone would not
have caught the blank-fade bug, because the element still animates. B sampled the dialog's
**text** on every tick, not just its opacity. I repeated that on the shipped result - 13
frames, the course title present in every one, `contentBlankAtAnyFrame: false`.

There is a difference between "the element animates" and "the animation shows the right
thing," and only the second is worth having.

## The fix introduces two state leaks; A caught both

Unmounting used to reset component state for free. Keeping the dialog mounted converts
that into a leak, and neither B nor C noticed:

1. **`CourseDetailModal.testimonials` is keyed to nothing.** Reopening for a different
   course shows the *previous* course's testimonials until the new fetch resolves.
2. **`EnrollmentModal.selectedClass` never resets between learners.** Every learner in a
   roster shares one `courseId`, so a class checked for Alice stayed checked when
   reopening for Charlie. A reproduced this live.

Verified independently: `EnrollmentModal`'s only effect is `if (isOpen) loadInventory()`,
with no reset keyed on `learner` or `isOpen`, and `setTestimonials([])` appears solely in
an error handler.

Both fixes grafted into C's render-time swap, so the reset happens in the same place the
identity changes rather than in a separate effect that could drift.

This is worth recording as a general point: **a fix that stops something unmounting
inherits responsibility for every reset that unmounting was silently providing.**

## C's coverage

C swept every `isOpen` / `onOpenChange` / `onClose` consumer and every `Dialog`, `Sheet`,
`Popover` and `DropdownMenu` usage outside `src/components/ui/`. It found the two instances
the plan named plus **a third latent one** at `StudentDashboard.tsx:440`, where the
`EnrollmentModal` usage has the identical fragile shape and is simply not triggered today
because nothing nulls `pendingEnrollment`.

Fixing it now closes the trap before someone falls into it. No Sheet or Popover consumer
has the shape, so the family is fully covered by these three.

C also chose the shape most resistant to being undone: the guard lives inside the modal
components, so a call site cannot reintroduce the bug by adding a conditional render.

## Rejected, with reasons

- **The plan's Option 2** (defer the state clear with a timer or transition-end listener):
  adds per-consumer state and couples call sites to plan 005's CSS durations.
- **`onAnimationEnd` / `data-state` gating**: better than a timer, but still patches around
  the coupling instead of removing it, and does not help `CourseDetailModal`'s
  internal-early-return shape.
- **`forceMount`**: already rejected in plan 005 for permanently activating `FocusScope`
  and `DismissableLayer`. Not needed here - Radix still unmounts normally.
- **Ref mutation during render**: blocked by the React Compiler lint rule.

## Measured

B, across both dialogs and all three dismissal paths (close button, Escape, backdrop),
sampling content **and** overlay separately:

    14 distinct frames on every path, content and overlay
    document.contains() false after every exit
    exit 202-221ms against a 320ms enter (contract wants ~60%)

A confirmed no permanent cost: no manual `addEventListener` or `setInterval` in the touched
files, `document.querySelector('[role="dialog"]')` null after every close, and a real CDP
`Tab` with the dialog closed lands on a page button, never inside the dialog. The
testimonial fetch fires exactly once per open and zero times while closed.

A also noted that mounting once instead of per-open means *fewer* StrictMode duplicate
fetches in development than before.

Verified by me on the shipped graft: 13 frames, title present every frame, clean unmount.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
