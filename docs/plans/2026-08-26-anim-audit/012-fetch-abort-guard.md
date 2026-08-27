# 012 - Guard the course-catalog fetch against double-invocation

Audit commit `7fdde76`. Depends on: nothing. Surfaced by plan 006.

## Context

Found by an arena candidate while measuring the new list stagger, and only visible
*because* of it. Before plan 006 a card remounting mid-load looked like nothing; now it
visibly restarts its entrance while its neighbours continue.

`src/hooks/useProgramBuilder.ts:31` fetches the course catalog in a `useEffect` with **no
`AbortController` and no stale-response guard**. `src/main.tsx` wraps the app in
`<StrictMode>`, which deliberately double-invokes effects in development. The effect
therefore fires twice against the live Phillips API, and when the two responses arrive out
of order the later-but-stale one wins, remounting 2-3 cards mid-cascade.

Verified: duplicate `GET /api/Course/GetAllPartialValue` in the network panel, and the
symptom vanishes in a production build where StrictMode is absent.

StrictMode is not the bug. It is doing its job - surfacing an effect that is not
resilient to being run twice. The same race can happen in production whenever the
component remounts quickly or the network is slow enough for responses to overlap.

## Target

Make the fetch cancel-safe. Either:

1. **`AbortController`** - create one per effect run, pass `signal` to `fetch`, and abort in
   the cleanup. Standard, and it also stops the wasted request.
2. **A stale-response guard** - an `ignore` flag set in cleanup, checked before calling
   `setState`. Simpler, but leaves the request in flight.

Prefer (1). It fixes the race and the wasted call.

Note the repo has a `no-use-effect` skill, and this is exactly the pattern it targets:
data fetching in an effect with manual lifecycle management. Consider whether the fetch
belongs in an effect at all, but do not turn this into a data-layer rewrite - if a larger
change is warranted, say so and stop rather than doing it here.

## Files

- `src/hooks/useProgramBuilder.ts` - the effect at line 31
- Check `src/components/RosterList.tsx`, `ProgramManager.tsx`, `SupervisorDashboard.tsx`
  and `StudentProgressView.tsx` for the same shape; several fetch on mount.

## Scope boundaries

- Do not remove `StrictMode`. It is surfacing a real defect, not causing one.
- Do not change any API route, response shape, or error handling.
- Do not add a data-fetching library.

## Arena rubric

1. Exactly one catalog request survives per mount in development with StrictMode on.
2. No `setState` fires after unmount. Confirm no React warning in the console.
3. Cards do not remount mid-stagger. Frame-sample the cascade and confirm every card's
   entrance runs once, monotonically.
4. Error handling still works: kill the API and confirm the existing error path is intact,
   and that an aborted request is not reported to the user as a failure.
5. Every other on-mount fetch in the files above is either fixed the same way or explicitly
   noted as not needing it.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. DevTools Network, dev build: one `GET /api/Course/GetAllPartialValue` per mount.
3. Navigate away mid-request. No "state update on unmounted component" warning.
4. Throttle to Slow 3G, load the builder, frame-sample the stagger: no card restarts.
