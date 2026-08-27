# 008 - Delete the Vite starter leftovers

Audit commit `7fdde76`. Depends on: nothing. Can land at any point.

## Context

Three artifacts from project scaffolding are still in the tree, and two of them actively
fight the design system.

**`src/App.css`** is the stock Vite React template stylesheet, imported at `App.tsx:1`.
It defines `.logo`, `.logo.react`, `.card`, `.read-the-docs`, a `logo-spin` keyframe, and
a `#root` rule that sets `max-width: 1280px`, `padding: 2rem`, and `text-align: center`.
None of the class names appear in any component. Grep confirms it:

```
grep -rn "logo\|read-the-docs" src/ --include="*.tsx"   # no matches
```

The `#root` rule is the one that matters - it is not class-scoped, so it applies, and it
constrains the app shell.

**`src/index.css:135-152`** carries the template's global element styles:

```css
a { font-weight: 500; color: #646cff; text-decoration: inherit; }
a:hover { color: #535bf2; }
button { border-radius: var(--radius); font-family: inherit; cursor: pointer;
         transition: border-color 0.25s; }
button:hover { border-color: #646cff; }
```

`#646cff` is Vite purple. This app's accent is `#ff5000`. Every unstyled anchor in the
app is currently the wrong brand color, and every button carries a stray 0.25s
`border-color` transition that no design calls for.

**`tailwind.config.js`** is dead. Tailwind v4 only reads a JS config when a stylesheet
declares `@config`, and none does. Its content globs point at `./pages/`, `./components/`,
`./app/` - Next.js defaults this repo does not have. It also imports `tailwindcss-animate`
and declares a `phillips` color extension that `@theme` in `index.css` already supersedes.

`App.css:30` also holds the repo's only `prefers-reduced-motion` media query, and it is
inverted (`no-preference`), guarding the dead logo spinner. Plan 001 adds the real one.

## Files

- Delete `src/App.css`; remove its import at `src/App.tsx:1`.
- Delete `src/index.css:135-152`.
- Delete `tailwind.config.js`.
- `src/index.css:5` - `@plugin "tailwindcss-animate"` and the matching `devDependencies`
  entry, **only if** plan 005 has already established nothing depends on it. If 005 has
  not landed, leave both alone and say so.

## Steps

1. Confirm by grep that no component references `.logo`, `.card`, or `.read-the-docs`.
2. Check what `#root` currently contributes. `App.tsx` renders `h-screen` flex layouts,
   so the `max-width` / `padding` / `text-align: center` may be doing nothing - or may be
   silently constraining the shell. Screenshot before and after at 1440px and at 390px.
   **This is the real risk in this plan**: deleting a rule that turns out to be
   load-bearing. Verify visually, do not reason about it.
3. Delete `App.css` and its import.
4. Delete the starter block from `index.css`. If any anchor in the app relied on the
   global `a` color, restyle it with a token instead of keeping `#646cff`.
5. Delete `tailwind.config.js`.
6. Re-check `postcss.config.js` and `vite.config.ts` for a reference to the deleted
   config before removing it.

## Scope boundaries

- Do not add any animation. This plan only removes.
- Do not touch `components.json`, which shadcn's CLI reads.
- Do not change `@theme` in `index.css`.

## Arena rubric

1. No visual regression at 1440px, 1024px, and 390px, in both light and dark, evidenced
   by before/after screenshots rather than by argument.
2. No dead CSS or dead config left behind.
3. No remaining `#646cff` or `#535bf2` anywhere in the repo.
4. Build output is not larger than before.
5. The `tailwindcss-animate` call is correct for whether plan 005 has landed.

## Verification

1. `bun run build`, `bun run lint`, `bun run test` pass.
2. `grep -rn "646cff\|535bf2\|read-the-docs\|logo-spin" src/ tailwind.config.js` returns
   nothing.
3. Screenshot the auth portal, supervisor dashboard, program builder, and student
   progress view at three widths, light and dark, before and after. Diff them.
4. Confirm the app shell still fills the viewport and is not centred in a 1280px column.
