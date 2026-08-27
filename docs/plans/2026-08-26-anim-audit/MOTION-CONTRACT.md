# Motion contract

Binding for every plan in this directory and every arena candidate implementing one.
Audit commit `7fdde76`.

## The curve directive

**All motion in this app starts fast and decelerates into its landing.** Quick off the
mark, slowing as it settles into the final pose.

In CSS that is **`ease-out`**. It is **never `ease-in`**.

This trips people up because the directive is phrased in motion-design terms, where
"easing in to the final keyframe" describes the *landing* being cushioned. CSS names its
curves after the *start* of the motion instead, so the same behaviour is spelled
`ease-out`. Two vocabularies, opposite words, identical result.

```
fast start ──────────────╮
                          ╰────────── slow landing     = CSS ease-out   ✓ this app
slow start ╭──────────────
           ╰───────────────────────── fast exit        = CSS ease-in    ✗ never on entrances
```

A candidate that emits `ease-in` on anything entering the screen has misread the brief.
`ease-in` is correct in exactly one place: an element **leaving**, where accelerating
away is the point.

## Tokens

Defined once in `src/index.css`. Never redefine locally; never hand-type a cubic-bezier
in a component.

### Easing

| Token | Value | Use for |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | **Default.** Anything entering or settling |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Moving or morphing on screen, resize |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets and drawers |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving. The only accelerating curve |

`--ease-exit` is byte-identical to Tailwind's stock `--ease-in`
(`node_modules/tailwindcss/theme.css:386`), so the compiler merges them into one
rule, `.ease-exit,.ease-in{...}`. That is not a duplication bug and must not be
"cleaned up". The ban on `ease-in` is about never putting an accelerating curve on
something *entering*. The same curve is correct on something *leaving*, and
`--ease-exit` is the name that says which one you meant.

`--ease-out` is a deliberately strong curve. It reaches most of its travel in the first
third of its duration, which is what produces the "quick, then a long soft landing" read.
Tailwind's stock `ease-out` (`cubic-bezier(0, 0, 0.2, 1)`) is far weaker and will not.

### Duration

Keyed to travel distance, since distance is what governs whether a duration feels right.

| Token | Value | Use for |
| --- | --- | --- |
| `--duration-micro` | `100ms` | Tint, press, focus ring. No travel |
| `--duration-swap` | `160ms` | In-place content swap. **Also the exit of small surfaces** |
| `--duration-pop` | `240ms` | Small anchored surface entering: menu, tooltip, badge |
| `--duration-surface` | `320ms` | Modal, accordion, container resize, toast |
| `--duration-travel` | `460ms` | Sheet, side panel, page-level, crossing the viewport |
| `--duration-stagger` | `45ms` | Per-item offset. Multiply by index |

### Travel and scale

`--travel-md` 8px, `--scale-in` 0.96, `--scale-press` 0.97.

Only these three are defined. `--travel-sm` (4px) and `--travel-lg` (16px) were in
an earlier draft of this contract and were cut: a grep across plans 002-008 found no
consumer for either. A one-off nudge should use a literal at the call site rather
than a token used once.

Never `scale(0)`. Nothing in the physical world appears from nothing.

## Rules

1. **Exit at ~60% of enter.** Entering is an introduction and earns time; leaving should
   get out of the way. Symmetric timing is the most reliable tell of generated motion.
2. **Enter decelerates (`--ease-out`), exit accelerates (`--ease-exit`).**
3. **Motion has an origin.** A menu grows from its trigger, a sheet from the edge it
   lives on. Set `transform-origin` deliberately. Modals are the exception: centred is
   correct, and `origin-center` there is not a defect.
4. **Name the properties. Never `transition: all`.** It catches colors mid-theme-switch
   and layout on resize, and runs off-GPU.

   **An element carries at most one `transition-*` utility.** `cn()` runs `tailwind-merge`,
   which treats every `transition-*` class as one mutually-exclusive group and keeps only
   the last. Adding motion to something that already animates silently deletes what was
   there. This has bitten three plans: 004 (a variant's `transition-colors` ate the cva
   base's list), and 006 twice (a crossfade would have deleted the card hover). Three ways
   out, in order of preference:

   - `[transition:a 100ms var(--ease-out),b 240ms var(--ease-out)]` - the arbitrary
     *property* form. One declaration, per-property timing, collision impossible. Note
     `transition-[a,b]` is NOT equivalent: it sets `transition-property` only and pulls
     timing from `--tw-duration`, so it cannot express different durations per property.
   - Drive one of them with `animation` instead. `animation-*` and `transition-*` are
     disjoint groups, so they coexist.
   - Put them on different elements.
5. **Prefer `transform`, `opacity`, `filter`,** and the individual `translate` / `scale` /
   `rotate` properties, which compose without clobbering each other the way the
   `transform` shorthand does. Exception: `grid-template-rows` for collapse, the only
   portable way to animate to intrinsic height.
6. **Reduced motion means less movement, not no feedback.** Zero the travel, keep a short
   crossfade. Never `transition: none` - that destroys the state-change signal.

## Personality

Crisp B2B education dashboard. Orange `#ff5000`, `--radius: 0rem`, hard corners.
Motion is confident and quick, not playful. No visible bounce or overshoot anywhere in
this app. If a candidate wants a spring, it needs to justify it against this line.

## Stack facts

- React 19, Vite 7, Tailwind v4 via `@tailwindcss/vite`, TypeScript, Bun.
- shadcn/ui on Radix primitives. `src/components/ui/` is vendored, so editing it is fine.
- Tailwind v4 config lives in `@theme` in `src/index.css`. `tailwind.config.js` is
  **never loaded** - v4 requires an explicit `@config` directive and there is none.
- Tailwind v4 has an `--ease-*` theme namespace. It resolves the `duration-*`
  utility against **`--transition-duration-*`**, not `--duration-*`; a token
  registered as `--duration-pop` generates no utility and raises no error. Duration
  tokens are therefore plain custom properties, referenced as
  `duration-(--duration-pop)`, rather than carrying two names for one value.
- Easing tokens use `@theme static`, not `@theme inline`. Tailwind tree-shakes any
  theme variable it sees no reference to, and until plans 002-007 land the only
  thing referencing these curves is the prose in this directory. Verified: under
  `@theme inline` with these docs excluded from the content scan, `--ease-out`,
  `--ease-drawer` and `--ease-exit` vanish from the bundle entirely, silently.
- Build output is emitted by Lightning CSS, which normalizes time units:
  `320ms` appears as `.32s`. Grep for the normalized form when verifying.
- `motion` (Framer) is approved for plan 007 only. No GSAP anywhere.
