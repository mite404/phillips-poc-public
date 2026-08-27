import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

/**
 * Animates a number toward `value`, returning the value to render.
 *
 * Counts from 0 on the first real value and from the previous value on every
 * update after, so a metric going 4 -> 5 ticks by one rather than restarting.
 *
 * @param value - the true value to land on
 * @param enabled - pass false while loading, so the count begins when real data
 *   arrives instead of running once against a skeleton and again after it
 * @returns the value to render; always exactly `value` once settled, and
 *   immediately `value` under reduced motion or while disabled
 */
export function useCountUp(value: number, enabled = true): number {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();
  const from = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || reduceMotion) return;

    const start = started.current ? from.current : 0;
    started.current = true;
    from.current = value;

    // animate() retargets from wherever it currently is when interrupted, so a
    // value that changes mid-count continues rather than snapping back to 0.
    const controls = animate(start, value, {
      duration: 0.46,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
      // Land on the exact integer. Rounding an eased float can stop one short,
      // which on a counter reads as an off-by-one bug rather than as motion.
      onComplete: () => setDisplay(value),
    });

    return () => controls.stop();
  }, [value, enabled, reduceMotion]);

  // Derived, not synchronised. Both of these want the true value on the very
  // first render, and writing it via setState inside the effect would cost an
  // extra render pass and trip react-hooks/set-state-in-effect.
  if (reduceMotion || !enabled) return value;
  return display;
}
