# Arena synthesis - plan 010, restore focus indicators

Three sonnet candidates. Base: **C**, grafted with **B**. All three converged on the same
base rule; the value was in what each found around it.

| | Lens | Outcome |
| --- | --- | --- |
| A | WCAG contrast, computed | Contrast table; flagged a razor-thin margin |
| B | Coverage - tab the whole app | Grafted from. Found a keyboard trap and a `focus:` bug |
| C | Why was it written, what breaks when it goes | **Base**. Found the ring was invisible anyway |

## The archaeology changed the framing

C ran `git log -S "FORCE REMOVE"` and found commit `f8b2dcb`, which in a single hunk:

```diff
-  --ring: oklch(0.704 0.04 256.788);
+  --ring: transparent; /* No default ring color */
-    @apply border-border outline-ring/50;
+    @apply border-border;
```

It deleted shadcn's *correct* fix (`outline-ring/50` recolours the native outline via the
theme token), set `--ring: transparent`, **and** added the blanket
`outline: none !important`. Three redundant kill switches at once.

The reason all three landed together is the useful part: `--color-ring` was not wired to
`--ring` at that commit, so the correct fix could not have worked. The author tried it, saw
nothing change, and escalated to a bigger hammer - twice.

**That wiring bug is fixed on HEAD** (`src/index.css:203`, `--color-ring: var(--ring)`). The
blanket rule outlived the problem it patched. This is not undoing a deliberate design
choice; it is removing scaffolding for a bug that no longer exists. That distinction is
what stops someone re-adding `outline: none` in six months, and it is why C's lens earned
its seat.

## The finding that mattered most

    --primary: #ff5000
    --ring:    #ff5000     identical

The `default` and `secondary` Button variants fill with `bg-primary`. A flush, non-offset
ring on those buttons is **orange on orange - invisible**. Not low contrast; the same
colour. Force Enroll, Publish Program, Assign, every filled button in the app.

So even with the blanket rule removed, most of the app's buttons would have shown nothing.
The plan would have been declared done while the AA failure persisted on the controls users
press most.

My own contrast table missed this because I computed ring-versus-*background*. On a filled
button the ring lands on the *button*, and that surface was not in my list. C fixed it with
`ring-offset-2 ring-offset-background`, matching the convention already in `dialog.tsx` and
`sheet.tsx`. Verified on the shipped result: background `rgb(255,80,0)`, ring-offset colour
`#ffffff`.

That crossed the plan's "do not touch component focus utilities" boundary. It was right to.

## Contrast, measured independently

A computed the table; I recomputed it. `--ring` `#ff5000` against each surface:

| Surface | Value | Ratio | |
| --- | --- | --- | --- |
| `--background` | `#ffffff` | 3.28:1 | pass |
| `--card-background` / `--sidebar` | `#fafafa` | 3.14:1 | pass |
| `--muted` / `--secondary` / `--accent` | `#f5f5f5` | **3.01:1** | pass, razor thin |
| `--border` | `#e5e5e5` | **2.61:1** | **fail** |

WCAG 1.4.11 wants 3.0:1. Two notes worth keeping:

- `3.01:1` is a pass the way a bridge rated for exactly the truck crossing it is safe. Any
  future darkening of the greys drops the app out of conformance with nothing failing a
  build.
- `--border` fails outright. My plan listed the surfaces to check and did not include it,
  which is why A did not test it. With `outline-offset: 2px` the ring is drawn outside the
  element, so a control sitting flush against a card border can land on it.

All three candidates converged on a single-colour ring and it passes everywhere that
actually occurs, so that is what shipped. **Recorded as fragile.** The robust alternative
is a two-tone indicator - a dark inner and light outer outline, which passes against any
backdrop - and it is the right move if these greys ever change.

## Defects the restoration exposed, all fixed

Every one of these was masked by the blanket rule and would have shipped invisible:

1. `StudentProgressView.tsx:180` - sort-header button had `focus-visible:outline-none` with
   no ring to replace it. Found by B and C independently.
2. `ProgramBuilder.tsx:100,179` - the description textarea and the filter chips overrode
   their component's ring down to `ring-0`. Found by B and C independently.
3. `StudentDashboard.tsx:257,370` - accordion triggers sit flush inside a rounded,
   `overflow-hidden` card; C measured the outward ring clipped 3px on three sides and
   scoped an inset ring to those two triggers.
4. `dialog.tsx:78`, `sheet.tsx:84` - modal close buttons used `focus:` rather than
   `focus-visible:`, so once the suppression lifted they would show a ring on a plain mouse
   click. B found this; grafted.

## No doubling

Nine components declare their own `focus-visible:ring-*` and had been suppressed the whole
time. B verified against all nine that Tailwind's utility layer always outranks the base
rule, so a component ring replaces the base outline rather than stacking with it.

## Verified by the parent, real input

Keyboard `Tab`:

    outline: 2px solid rgb(255, 80, 0)   offset 2px   :focus-visible matched

Real mouse click, via the browser's own click:

    matchesFocusVisible: false   outlineStyle: "none"

The distinction holds. My first attempt at the mouse case used synthetic pointer events
followed by `.focus()` and wrongly reported a visible ring - programmatic focus does not
reproduce pointer modality. B had flagged exactly this and used real input throughout.
Fifth instrument error recorded in this audit.

## Filed, not fixed

**A keyboard trap, and it is a worse failure than the one this plan fixed.** B found the
"+Status" and "+Level" facet options in `StudentProgressView.tsx` are plain
`<div onClick>` with no `tabIndex`, role or key handler. They cannot be reached by keyboard
at all. That is **WCAG 2.1 Level A, 2.1.1 Keyboard** - stricter than the AA failure this
plan addressed. Filed as [plan 014](../014-keyboard-traps.md).

A also reported that `ring-1` components render a 1px indicator, below the 2px thickness
WCAG 2.4.13 asks for, and that sidebar nav items showed a degraded indicator it could not
pin down. Both left for a follow-up.

## Checks

`bun run build` pass, `bun run lint` exit 0, `bun run test --run` 4 files / 56 tests.
`grep -rn "outline: none" src/` returns nothing.
