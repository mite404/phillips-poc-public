# Animation audit, 2026-08-26

A permanent record of an animation audit of this repo and the work that came out of it.
Kept so the reasoning is recoverable later, not just the diffs.

Source audit: the `improve-animations` skill, run against commit `7fdde76`.
Library triage: the `motion-kit` skill.

## Read in this order

1. **[MOTION-CONTRACT.md](MOTION-CONTRACT.md)** - the binding spec. Easing curves,
   duration scale, and the directive that all motion in this app starts fast and
   decelerates into its landing. Every plan and every implementer is held to it.
2. The numbered plans, which each carry their own Context section explaining why that
   change is worth making.
3. `arena/` - the decision records, once each plan has been implemented. This is where
   the reasoning lives: what was tried, what won, and what was rejected.

## The plans

`001` defines the tokens every other plan consumes, so it lands first. `008` is
independent and can land any time.

| Plan | Covers | Depends on | Status |
| --- | --- | --- | --- |
| [001](001-motion-tokens.md) | Motion token scale + global reduced-motion | - | **DONE** ([synthesis](arena/001-synthesis.md)) |
| [002](002-fix-accordion.md) | Accordion collapse animation | 001 | **DONE** ([synthesis](arena/002-synthesis.md)) |
| [003](003-kill-transition-all.md) | `transition-all` in six files | 001 | **DONE** ([synthesis](arena/003-synthesis.md)) |
| [004](004-press-feedback.md) | Press/active feedback on buttons | 001 | **DONE** ([synthesis](arena/004-synthesis.md)) |
| [005](005-overlay-starting-style.md) | Overlays: keyframes to transitions | 001 | TODO |
| [006](006-loading-and-swap.md) | Skeleton crossfade, icon swap, stagger | 001 | TODO |
| [007](007-view-and-theme-transition.md) | Screen transitions, theme, count-up | 001 | TODO |
| [008](008-starter-cleanup.md) | Delete Vite starter leftovers | - | TODO |
| [009](009-source-not-docs.md) | Exclude `docs/` from the Tailwind content scan | - | TODO |
| [010](010-restore-focus-rings.md) | Restore focus indicators (WCAG 2.4.7 failure) | - | TODO |

## How each plan gets implemented

Each plan runs through an **arena**: three candidates implement it independently in
isolated worktrees, each given a different lens rather than the same prompt, because
three identical prompts produce one opinion sampled three times. A separate judge scores
them against the plan's rubric. The strongest becomes the base, and the best ideas from
the other two are grafted in by hand.

One commit per plan, subject-scoped to the plan number so `git log` maps straight back
to the reasoning:

    feat(anim-001): install the motion token scale
    feat(anim-002): animate the accordion collapse

This follows the repo's existing ticket-scope convention (`refactor(eth-39): ...`).

The lenses vary per plan, but the shape is consistent: one candidate optimises for the
platform's own grain, one for the failure mode most likely to be missed, and one for the
smallest diff that still satisfies the contract.

## Why the rejections are the valuable part

`arena/` records what each candidate **rejected** and why, not only what shipped. A diff
tells you the answer; it does not tell you the three answers that were considered and
dropped, or what evidence killed them. That is the part worth reading later, and it is
the part that is normally thrown away.

Where a candidate's claim was checked against reality (built CSS, a performance trace,
a browser feel-check) the record says so. Where something could not be judged from code
alone, it says that too.
