# 007 - Screen transitions, theme switch, and metric count-up

Audit commit `7fdde76`. Depends on: 001. Read `MOTION-CONTRACT.md` first.

**This is the only plan permitted to add a dependency.**

## Context

Three gaps that plain CSS cannot cleanly close.

**Screens teleport.** `src/components/PageContent.tsx:36-46` picks one of five whole
screens with a ternary chain:

```tsx
{userType === "student" && currentView === "programs" ? <StudentDashboard />
 : currentView === "dashboard" ? <SupervisorDashboard onNavigate={onNavigate} />
 : isStudentProgressView && studentId ? <StudentProgressView studentId={studentId} />
 : isProgramView ? <ProgramManager programId={currentView} />
 : <ProgramBuilder onProgramSaved={onProgramSaved} />}
```

React unmounts the outgoing screen the instant `currentView` changes. `@starting-style`
cannot animate a node React has already removed, which is `motion-kit`'s documented
"exit animation in a React list" case - one of the six where CSS genuinely loses.

**Theme switch flashes.** `src/App.tsx:33-38` toggles the `dark` class inside a
`requestAnimationFrame`. Every color on the page changes in one frame.

**Metrics snap.** `src/components/MetricCard.tsx` renders its value directly. A dashboard
number appearing instantly is the canonical case for a count-up, and CSS cannot
interpolate an integer portably.

### A note on the dependency

The original triage recommended **against** adding `motion`, on the grounds that the
View Transition API covers screens at zero bundle cost and a count-up is a short hook.
The user reviewed that and chose to add `motion` anyway. That decision stands and is not
to be re-litigated by any arena candidate. What is still open is *how much* of the app
`motion` should own, which is a real design question the arena should explore:

- `motion` for screen transitions **and** count-up.
- `motion` for screen transitions; a local hook for count-up.
- View Transition API for screens and theme; `motion` only where it clearly wins.

Whichever a candidate picks, it must justify the split rather than defaulting to "use the
library everywhere because it is installed."

## Files

- `package.json` - add `motion` to `dependencies`.
- `src/components/PageContent.tsx:31-47`
- `src/App.tsx:32-43` - `handleThemeToggle`
- `src/components/MetricCard.tsx`

## Target values

- Screen transition: `--duration-surface` (320ms) enter, ~190ms exit, `--ease-out`.
  Exiting screen fades and drops back slightly; entering screen rises `--travel-md` (8px)
  and fades in. No horizontal slide - these are sibling views, not a stack.
- Theme switch: `--duration-swap` (160ms) crossfade. Colors only; nothing may move.
- Count-up: `--duration-travel` (460ms), `--ease-out`. Counts from 0 on first load only,
  and from the previous value on update.

## Steps

1. `bun add motion`. Import from `motion/react` (the current package; `framer-motion` is
   the legacy name and must not be used).
2. Wrap the ternary chain in `<AnimatePresence mode="wait">`. `mode="wait"` matters here:
   these screens are full-height, and overlapping two of them double-scrolls the page.
   Each branch needs a stable, distinct `key`.
3. Set the transition values from the token scale, not from Framer's defaults. Framer's
   default is a spring, and the contract forbids visible bounce in this app.
4. Use `useReducedMotion()` from `motion/react` and branch the transform values. Contract
   rule 6: reduce the movement, keep the crossfade.
5. Theme switch in `App.tsx`. Prefer `document.startViewTransition` where supported,
   with a plain fallback where it is not - Firefox has no support, and its fallback is an
   instant swap, which is exactly today's behaviour, so there is no regression risk.
   Remove the `requestAnimationFrame` wrapper if the new approach makes it dead weight.
6. Count-up in `MetricCard.tsx`. Must respect reduced motion by rendering the final value
   immediately, must not animate the skeleton-to-value handoff into a count from zero
   twice, and must not break the existing `isLoading` branch at line 19.

## Performance note

`AUDIT.md` category 5: Framer's `x` / `y` / `scale` shorthand props are **not**
hardware-accelerated - they run on the main thread. Prefer the full transform string, or
verify with a DevTools performance trace that the screen transition holds 60fps on the
heaviest screen (`StudentProgressView`, which renders a large table).

## Scope boundaries

- Do not add routing. `currentView` stays a `useState` string.
- Do not convert any other component to `motion`. The blast radius is these three files.
- Do not add `framer-motion` alongside `motion`. One package.
- Do not animate the footer or sidebar during a screen transition. Only the main area.

## Arena rubric

1. Screens cross-transition without the page double-scrolling or jumping height.
2. Transition values come from the token scale; no Framer spring default survives.
3. Reduced motion is handled via `useReducedMotion()`, not by disabling the transition.
4. The theme switch crossfades colors with zero layout movement.
5. Count-up lands exactly on the true value, never off by one, and handles a value
   changing mid-count.
6. The dependency footprint is justified in the rationale, including what was left on
   CSS and why.
7. 60fps on `StudentProgressView`, evidenced by a trace and not asserted.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. `git diff package.json` shows exactly one added dependency.
3. Feel-check:
   - Click through all five screens via the sidebar. Watch for height jump or a
     double scrollbar during the handoff.
   - Navigate rapidly between two screens. `mode="wait"` should queue, not overlap.
   - Toggle the theme. Colors crossfade; no element moves.
   - Reload the supervisor dashboard and watch the metric cards count up once.
   - Reduced motion: screens crossfade, metrics render final values immediately.
   - DevTools Performance, record a transition into `StudentProgressView`. Confirm
     60fps and no long main-thread task.
