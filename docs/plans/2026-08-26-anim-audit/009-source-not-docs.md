# 009 - Exclude `docs/` from the Tailwind content scan

Audit commit `7fdde76`. Depends on: 001 (see the interaction warning below).

## Context

Found while measuring plan 001's bundle impact. It has nothing to do with animation and
predates all of this work.

Tailwind v4's content scanner has no file-type opinion. It walks everything not
gitignored and treats any token shaped like a class name as one. This repository has a
large `docs/` tree - `SPEC.md` (44 kB), `FOR_ETHAN.md` (34 kB), `IMPLEMENTATION.md`
(24 kB), two PR tutorials, and now this plan directory - full of backticked class names
and code samples. Every one of them becomes real emitted CSS.

Controlled build on the untouched tree, nothing else changed:

```
WITHOUT docs/: 63,288 bytes
WITH docs/:    67,884 bytes      ->  4,596 bytes, 6.8% of the bundle
```

## Target

```css
@source not "../docs";
```

One line in `src/index.css`, next to the existing `@import "tailwindcss"`. Verified:
returns the bundle to 63,288 bytes.

## Why this is safe

A class used by **both** a doc and a real component is still emitted, because `src/` is
still scanned. This only removes classes that exist solely because someone documented
them.

## Interaction warning - read before applying

**Do not apply this before plan 001's `@theme static` change is in.** Under
`@theme inline`, three of the four easing tokens exist in the bundle only because their
names appear in the prose of `docs/plans/2026-08-26-anim-audit/`. Excluding `docs/`
first would silently delete `--ease-out`, `--ease-drawer` and `--ease-exit`, with no
build error. Plan 001 as landed uses `@theme static`, which is immune. See
[arena/001-synthesis.md](arena/001-synthesis.md).

## Steps

1. Add the `@source not` directive to `src/index.css`.
2. Build and confirm the bundle drops to ~63.3 kB.
3. Diff the emitted rule sets before and after. Every removed rule must be one no
   component uses. If a real utility disappears, a component is relying on a class that
   only a doc mentions, which is its own bug worth surfacing.
4. Screenshot the app before and after at 1440px and 390px, light and dark.

## Scope boundaries

- Do not edit any markdown to work around the scanner. The directive is the fix.
- Do not exclude `src/`.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. Bundle is ~63.3 kB, down from ~67.9 kB.
3. All four easing tokens still present in the emitted CSS.
4. No visual diff.
