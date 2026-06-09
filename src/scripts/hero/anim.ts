/**
 * Animation and formatting primitives shared across the hero map
 * modules. Everything here is pure (no DOM lookups, no shared state)
 * apart from tickTo/tickInt, which write into the element they're
 * given.
 */

export const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Format a dollar amount for display.
 *  - $12M / $1.5M / $1.25M for millions (1 decimal above $10M, else 2)
 *  - $850K for thousands
 *  - $42 for sub-thousand
 * Trailing zeros after the decimal are stripped so "5.00M" reads as "5M".
 */
export const fmt = (n: number) =>
  n >= 1_000_000
    ? '$' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, '') + 'M'
    : n >= 1_000
      ? '$' + Math.round(n / 1_000) + 'K'
      : '$' + Math.round(n);

/**
 * Animate a number into an element using the cubic-out ease.
 * @param el      Element whose textContent receives the running value.
 * @param target  Final value (in dollars; formatted via fmt()).
 * @param prefix  Optional prefix prepended to each tick (e.g., '+ ').
 * @param dur     Total animation duration in ms.
 */
export const tickTo = (el: HTMLElement, target: number, prefix = '', dur = 1100) => {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = prefix + fmt(target * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/** Same as tickTo() but renders as a localized integer (commas). Used
 *  for jobs counts. */
export const tickInt = (el: HTMLElement, target: number, prefix = '', dur = 1100) => {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = prefix + Math.round(target * ease(t)).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/**
 * Tiny LCG for deterministic jitter inside computeShares(). Same
 * study coords always produce the same neighbor pattern so a
 * given scene looks identical across reloads.
 *
 * @param seed Seed value. Use any integer.
 * @returns A function that returns the next pseudo-random float in [0, 1).
 */
export const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
