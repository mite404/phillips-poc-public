# Arena synthesis - plan 012, guard the catalog fetch

Three sonnet candidates. Base: **C**, grafted with **B**. All three independently found the
same trap; they disagreed about what to do with it, and the disagreement was rooted in my
own plan text.

| | Lens | Outcome |
| --- | --- | --- |
| A | The abort mechanism itself | Found the trap; crossed a scope boundary to fix it |
| B | Every on-mount fetch, judged per site | Grafted from. Widest coverage, respected the boundary |
| C | Reproduce the symptom, then prove it gone | **Base**. Got both, without the violation |

## The naive fix would have done nothing

All three found it. Every API reader swallows errors and resolves with fallback data:

```ts
export async function getCatalog(): Promise<CourseCatalogItem[]> {
  try { ... } catch (error) {
    console.warn("Legacy API failed, using fallback data:", error);
    return coursesData as CourseCatalogItem[];   // resolves successfully
  }
}
```

So wiring an `AbortController` and aborting in cleanup cancels the request, and then the
stale invocation **still** gets a successful-looking promise and **still** calls
`setState`. The race the plan set out to prevent happens anyway.

Worse than a no-op: the cancelled call resolves with **static local seed data**, so stale
`Courses.json` content could win over a live API response.

## The disagreement, and why C wins

My own scope boundary said: *"Do not change any API route, response shape, or error
handling."*

- **A** rethrew `AbortError` from `legacyRoutes`/`localRoutes` instead of falling back.
  Correct at the root, but it changes shared error handling - exactly what the plan
  forbade.
- **B** used a cleanup-scoped `ignore` flag everywhere and explicitly declined
  `AbortController`, reasoning that it cannot work without touching that error handling.
  Respects the boundary, but never cancels the request, so in-flight calls accumulate
  against a live API.
- **C** got both: `AbortController` to cancel, **plus** a `signal.aborted` check before
  every `setState`, independent of whether the awaited call threw or resolved. Threading
  the signal needed only an additive optional `signal?: AbortSignal` parameter on six API
  functions - no route, shape, or error-handling change.

C's shape is the one that does not depend on the swallow being fixed, and does not depend
on it staying broken either. It survives someone repairing the error handling later.

## C reproduced the bug first, and it is worse than the plan described

I filed this plan from another candidate's report in plan 006 and never saw the symptom
myself. C reproduced it on unmodified code before touching anything: Slow 3G, frame-sampled
the Program Builder cascade with a sampler tagging DOM node identity per title.

The mechanism is not simply "stale response wins". The live staging endpoint returns
`totalCount: 71` on every record - it is serving a **rotating slice** of a 71-course
catalog, not a stable list. So the two racing requests came back with *partially different
course sets*:

    6 of 10 cards  same courseId in both responses, opacity held at 1.00, no regression
    4 of 10 cards  torn down at t~5.37s, replaced by 4 DIFFERENT courses at t~5.39s,
                   each restarting its own entrance

That is the "2-3 cards restart mid-cascade" symptom, confirmed with real frame data. It
also means the double-fetch was showing users a different catalog depending on which
response won.

## Dead code found

C verified `useProgramBuilder`'s `toast.error("Failed to load course catalog")` was already
unreachable before this plan: `getCatalog()` never rejects, so that catch block only ever
sees a `.map()` transform error, never a network failure. Confirmed by simulating a real
API outage - the fallback catalog renders silently with no toast.

## Grafted from B: three files C left alone

B swept every `useEffect` in the repo and covered three sites outside the plan's list:
`StudentDashboard.tsx`, and both modals.

The modals needed different reasoning, and B was the only candidate to notice.
**Plan 011 made them permanently mounted three commits ago**, so their race is no longer
StrictMode double-invocation - it is a stale course/learner response landing after a
*different* one has already opened. B reproduced this live with a monkeypatched `fetch`
(8s versus 300ms) and confirmed the guard discards the stale response with no visible
glitch.

Also noted by A: `AppSidebar.tsx` had the same shape with a `mounted` boolean and no
controller, measured at **4 requests per mount instead of 2**. `SidebarNav.tsx` has the
identical pattern but is never imported - left alone, deliberately, by both A and C.

## Verified by me

    cards tracked:               10
    card restarts or remounts:    0

Zero, against C's measured 4-of-10 before the fix.

One precision note on my own measurement: I also counted `Course` requests per builder
mount and saw **2**, which is correct and expected - StrictMode always double-invokes the
effect. The fix does not prevent the second request from being *initiated*; it ensures the
first is aborted and its response cannot reach `setState`. A and C both confirmed the
outcomes in the network panel (one `net::ERR_ABORTED`, one `200`). My `window.fetch` patch
counts initiations, not outcomes, so it cannot show that on its own - stated here so the
number is not read as a contradiction.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
No React "state update on unmounted component" warning when navigating away mid-request.
