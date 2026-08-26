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

`--travel-sm` 4px, `--travel-md` 8px, `--travel-lg` 16px, `--scale-in` 0.96,
`--scale-press` 0.97.

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
- Tailwind v4 has an `--ease-*` theme namespace but **no `--duration-*` namespace**.
  Duration tokens are plain custom properties, referenced as `duration-(--duration-pop)`.
- `motion` (Framer) is approved for plan 007 only. No GSAP anywhere.
