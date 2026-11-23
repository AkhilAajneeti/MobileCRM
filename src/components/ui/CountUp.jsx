import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animates a number from `from` to `end` on mount.
 *
 * Driven by requestAnimationFrame rather than CSS, so the global
 * prefers-reduced-motion rule in tailwind.css cannot reach it — the
 * reduced-motion case is handled explicitly here by jumping to the final
 * value.
 */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const CountUp = ({
  end,
  from = 0,
  duration = 1600,
  delay = 0,
  format = (value) => String(value),
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(prefersReducedMotion ? end : from);
  const frameRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(end);
      return undefined;
    }

    let startTime = null;

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(from + (end - from) * easeOutCubic(progress));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    timerRef.current = setTimeout(() => {
      frameRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timerRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, from, duration, delay, prefersReducedMotion]);

  return <>{format(Math.round(value))}</>;
};

export default CountUp;
