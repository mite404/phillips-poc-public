# 015 - The dark class is never applied on mount

Audit commit `7fdde76`. Depends on: nothing. Found during plan 013.

## Context

Found by an arena candidate while verifying layout at both themes: the theme toggle flips
its icon but `document.documentElement.className` never gains `dark`, and the background
stays light.

Traced and confirmed **pre-existing**, not caused by plan 007's View Transition change.
The class flip is byte-identical before and after that commit; 007 only replaced the
`requestAnimationFrame` wrapper.

The real defect is that **nothing applies the class on mount**. `src/App.tsx` reads the
stored preference into state:

```tsx
const [lightMode, setLightMode] = useState(() => {
  return localStorage.getItem('theme') === 'light';
});
```

and writes it back in an effect. But `documentElement.classList` is only ever touched
inside `handleThemeToggle`. On first paint there is no `dark` class regardless of what
state says.

## Why this produces a desynced first click

With no stored preference, `lightMode` is `false` - the app believes it is in dark mode.
The document has no `dark` class, so it renders light. The icon renders from `lightMode`,
so it shows the dark-mode icon over a light page.

The first click then computes `next = !false = true` and calls
`classList.toggle('dark', !true)`, i.e. `toggle('dark', false)` - removing a class that was
never there. **The first click changes the icon and nothing else.** The second click
finally adds `dark` and the theme appears to work from then on.

So the bug reads as "the toggle is broken the first time" and is easy to dismiss as a
fluke.

## Target

Sync the class to the state, in one place, so the two cannot drift.

1. **Apply on mount and on change.** An effect keyed on `lightMode` that sets the class is
   the smallest correct fix and removes the class-flipping from the click handler
   entirely - the handler then only calls `setLightMode`.
2. **Avoid the flash.** An effect runs after first paint, so the page renders in the wrong
   theme for a frame before correcting. The standard fix is a tiny inline script in
   `index.html` that reads `localStorage` and sets the class before React mounts. Judge
   whether the flash is visible enough here to warrant it.
3. Keep `startViewTransition` for user-initiated toggles. It should **not** wrap the
   mount-time application, or the first paint animates for no reason.

Note the repo has a `no-use-effect` skill and its lint config ships the React Compiler
rules; plan 007's `useCountUp` was rejected for calling `setState` inside an effect. This
is a legitimate effect - it synchronises React state to an external system (the DOM
outside React's tree), which is exactly what effects are for. Do not contort it.

## Files

- `src/App.tsx` - `lightMode` state, `handleThemeToggle`, the persistence effect
- `index.html` - only if adding the pre-paint script
- `src/components/layout/SiteHeader.tsx` - the icon reads `lightMode`; confirm it agrees
  with the document after the fix

## Scope boundaries

- Do not change the colour tokens or the `.dark` palette.
- Do not add a theme library. `next-themes` is already a dependency but wiring it in is a
  larger change than this bug warrants; if you think it is the right answer, say so and
  stop rather than doing it.

## Arena rubric

1. On first load with no stored preference, the icon and the actual theme agree.
2. The **first** click changes the theme, not just the icon.
3. A stored preference is honoured on reload, in both directions.
4. No flash of the wrong theme on load, or an explicit statement that it was judged
   acceptable and why.
5. The View Transition still runs on user toggles and does not run on mount.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Clear `localStorage`, load, and read `document.documentElement.className` and the icon.
   They must agree.
3. Click once. Assert the class changed and a colour actually changed - sample a computed
   `background-color`, do not judge by eye.
4. Reload with each stored value and confirm both are honoured.
5. Throttle to Slow 3G and watch for a wrong-theme flash on load.
