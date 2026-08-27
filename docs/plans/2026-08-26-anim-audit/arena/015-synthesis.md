# Arena synthesis - plan 015, theme never applies on mount

Two sonnet candidates. Base: **B**, extended because fixing the wiring exposed a broken
palette.

| | Lens | Outcome |
| --- | --- | --- |
| A | Correctness of the state-to-DOM sync | Measured the flash; caught a StrictMode bug in its own draft |
| B | Is the dark theme even correct once it applies | **Base**. Audited a palette nobody had seen |

## Reproduced first

A confirmed the plan's account with real values before touching anything. On mount with no
stored preference: `className=""`, `bodyBackgroundColor="rgb(255,255,255)"`,
`aria-label="Switch to light mode"` - state said dark, the DOM said light. The first click
flipped only the `aria-label` and `localStorage`; `className` and background were
byte-identical before and after. The second click finally applied `dark`.

## `useLayoutEffect`, not `useEffect`

Both candidates converged on this and B gave the sharpest reason: a passive effect commits
**after** paint, so `startViewTransition` would capture its "after" snapshot before the
class change landed and the crossfade would silently no-op. The plan said "an effect"
without qualifying which, and the passive one would have produced a fix that works and
does not animate.

## The flash needed the inline script, and A proved it

A initially believed `useLayoutEffect` alone would suffice, then measured: **~90ms and 3
painted frames** with the wrong class on localhost. `useLayoutEffect` only closes the gap
inside React's render cycle, not the module fetch/parse/execute window before React mounts,
during which the render-blocking stylesheet has already painted light-theme variables.

A's conclusion, which I agree with and which corrects the plan: for a pure CSR Vite app
with a render-blocking stylesheet, the inline pre-paint script is not one reasonable option
among several - it is the only mechanism that runs early enough. The plan framed it as a
judgment call.

## A caught a StrictMode bug in its own first draft

A's first attempt used a `useRef(true)` first-render flag. React 19's StrictMode
double-invokes mount effects in dev, so the flag flipped on the phantom second invocation
and fired a spurious `startViewTransition` on mount - confirmed by monkey-patching
`document.startViewTransition` and counting: 1 call after reload, 0 clicks.

Replaced with a comparison of the *value* being applied rather than a count of invocations.
B avoided the problem structurally by wrapping the state update itself
(`startViewTransition(() => setLightMode(next))`), which needs no ref at all. Took B's.

## The palette nobody had ever seen

This is why B's lens earned its seat. The class has never applied on mount and the first
click was a no-op, so **dark mode has been unreachable in normal use for as long as the bug
existed**. Fixing the wiring revealed it for the first time.

B found ~30 call sites using hardcoded Tailwind palette colours instead of theme tokens.
Verified independently, and worse than B measured:

    text-slate-900  #0f172a on #171717   1.00:1   identical luminance, invisible
    text-slate-800  #1e293b on #171717   1.23:1
    text-slate-700  #334155 on #171717   1.73:1
    text-slate-600  #475569 on #171717   2.37:1

WCAG AA body text requires 4.5:1. `text-slate-900` was used for names and headings,
including an `<h2>` on the student progress view.

## Extended past the plan, deliberately

B reported these and did not fix them, per its brief. With no new tickets to file them
into, and because **shipping 015 alone would make dark mode reachable and unusable**, they
are fixed here. Same reasoning as plan 013's `ProgramManager` fix: this commit is what
makes the defect visible, so it owns it.

Swept in three passes, each catching what the previous missed:

1. `text-slate-{600..900}` -> `text-foreground` / `text-muted-foreground`, 32 sites
2. `bg-slate-{100,200}`, `text-slate-{400,500}`, and a stray `border-slate-100` -> theme
   equivalents, 28 more. Found because a browser check showed "No Image" placeholder chips
   still rendering light-on-light at **1.05:1**.
3. `text-black` -> `text-foreground`, 2 sites. Found only by **looking at a screenshot** -
   the "Create Custom Program" heading was black on near-black. No slate grep would ever
   have caught it.

`bg-black/80` on the dialog and sheet scrims was left alone: a modal backdrop is correctly
black in both themes. `text-white` on a coloured badge likewise.

Zero hardcoded palette colours remain in live components.

## Verified

    on mount (no stored preference):  className "dark", bg oklch(0.09 ...), icon agrees
    after ONE click:                  className "", bg rgb(255,255,255), icon flipped
    firstClickChangedTheme:           true

    "Create Custom Program" heading:  oklch(0.985 0.001 17.2) on oklch(0.09 0.002 17.2)
    matches theme foreground:         true
    hardcoded slate in rendered DOM:  false

Screenshot at `.context/arena/015/dark-mode-after.png`.

## Three instrument errors of mine, recorded

I tried three times to compute contrast ratios in-page and got 1.00:1 for everything -
including text that is plainly near-white on near-black. My `lum()` parsed
`oklch(0.985 0.001 17.2)` by regexing the first three numbers as RGB channels, so both
foreground and background became the same garbage value. A canvas `fillStyle` round-trip did
not convert it either.

The measurement that actually settled it was reading the OKLCH lightness channel directly -
0.985 against 0.09 - plus a screenshot. Which is also how the `text-black` heading was
found, after two automated sweeps missed it.

Seventh instrument error logged in this audit, against a comparable number of real defects.
When a check disagrees with a claim, the check is wrong about as often as the claim is.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
