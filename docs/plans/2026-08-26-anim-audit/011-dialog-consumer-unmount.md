# 011 - Dialog consumers unmount before their exit can play

Audit commit `7fdde76`. Depends on: 005 (which made the exit animation exist at all).

## Context

Found by an arena candidate while verifying plan 005's dialog exits. Plan 005 gave every
overlay a working exit transition, held open by an `exit-gate` keyframe so Radix's
`Presence` defers unmount while it plays. Verified working on the dropdown: 11 distinct
frames, then a clean unmount.

**The dialog exit will still never be seen**, because both real consumers remove the
entire component from the React tree in the same callback that closes it.

`src/components/common/CourseDetailModal.tsx:54`:

```tsx
if (!course) return null;
```

The parent nulls `course` on close, so the whole `<Dialog>` disappears on that render.

`src/components/RosterList.tsx:299`:

```tsx
{selectedLearner && firstCourseId && (
  <EnrollmentModal isOpen={!!selectedLearner} onClose={() => setSelectedLearner(null)} ... />
)}
```

Same shape: `onClose` clears the state that the conditional render depends on.

Radix `Presence` can only defer unmounting a node **it still owns**. When React removes
the ancestor, there is nothing left to defer. This is a consumer-side React pattern, not a
CSS problem, and no amount of transition work fixes it.

It is also the same failure shape as plan 002's Radix reflow bug and plan 004's
self-removing button: motion correctly declared, never given a frame.

## Target

Keep the dialog mounted through its own exit. The `open` prop already drives visibility, so
the conditional render is redundant - it is belt-and-braces that costs the animation.

Two viable shapes, and the arena should pick:

1. **Drop the conditional, keep the guard inside.** Render `<Dialog open={isOpen}>`
   unconditionally and let the component handle a null `course` in its body rather than
   returning `null` above the `Dialog`. Smallest diff; means the dialog subtree stays
   mounted for the page's lifetime.
2. **Defer the state clear.** Keep the conditional but clear `selectedLearner` / `course`
   after the exit completes rather than in `onClose`. Preserves unmounting, at the cost of
   a timer or a transition-end listener, which is state to maintain.

Option 1 is simpler and matches how Radix expects to be used. Option 2 avoids keeping
subtrees alive. Weigh mount cost against complexity, and note `CourseDetailModal` fetches
testimonials in an effect keyed on `isOpen && course` - check that option 1 does not make
it fetch when closed.

## Files

- `src/components/common/CourseDetailModal.tsx` - line 54 and its call sites
- `src/components/RosterList.tsx` - line 299
- `src/components/common/EnrollmentModal.tsx` - check whether it has the same guard

## Scope boundaries

- Do not change any dialog's visual design or its CSS motion. Plan 005 owns that.
- Do not add a state-management library or a new abstraction for modal lifecycle.

## Arena rubric

1. The dialog exit actually plays, verified by frame sampling on close, on every dismissal
   path: Escape, backdrop click, and the close button.
2. No dialog opens or fetches when it should not. `CourseDetailModal`'s testimonial fetch
   must not fire while closed.
3. No stale content flash: reopening for a different course must not show the previous
   course during the enter.
4. No memory or listener leak from keeping subtrees mounted.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Open a course modal, dismiss it three ways, frame-sample `opacity` on the content each
   time. Each should produce more than one distinct value before unmount.
3. Open course A, close, open course B. Confirm B's enter shows B's content.
4. Network tab: confirm no testimonial request fires while the modal is closed.
