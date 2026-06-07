"use client";

import { useCallback, useState } from "react";

/** Custom Hook — owns checkout step navigation (drives the Stepper compound component). */
export function useCheckoutStep(count: number) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((c) => Math.min(count - 1, c + 1)),
    [count],
  );
  const back = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const goTo = useCallback(
    (i: number) => setCurrent(Math.max(0, Math.min(count - 1, i))),
    [count],
  );

  return {
    current,
    isFirst: current === 0,
    isLast: current === count - 1,
    next,
    back,
    goTo,
  };
}
