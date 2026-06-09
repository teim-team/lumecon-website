/**
 * Auto-cycle scheduling for the hero map.
 *
 * Level-rotating scene cycle: pulling from one shuffled deck of all
 * scenes would make the cycle reservation-heavy (reservation has ~200
 * scenes vs. 12 state / 20 county), so each level keeps its own
 * shuffled deck and the rotation goes state → county → reservation →
 * state → ... to keep the visual variety balanced.
 *
 * The scheduler owns all pause/timer state so callers interact with
 * named intents (cancel, suspendFor, setHoverPaused) instead of
 * sharing raw timeout ids and pause flags.
 */

/** Default delay between auto-cycle studies. Each run takes ~3s to
 *  land all the live figures + scatter dots; the rest is "breathing
 *  room" so the result sticks long enough to read before the next
 *  study fires. */
const CYCLE_DELAY_MS = 10_000;

/** Short delay used when resuming after a hover pause — the visitor
 *  has just stepped away, no need for the full breathing room. */
const RESUME_DELAY_MS = 1_200;

/**
 * A rotation over per-level shuffled decks. next() returns a scene
 * from the current level's deck (reshuffling when the deck empties)
 * and advances to the next level.
 */
export const createLevelRotation = <T>(pools: ReadonlyArray<ReadonlyArray<T>>) => {
  const orders: number[][] = pools.map(() => []);
  let levelIdx = 0;
  const reshuffle = (idx: number) => {
    const arr = pools[idx].map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    orders[idx].push(...arr);
  };
  return {
    next(): T {
      const idx = levelIdx;
      if (orders[idx].length === 0) reshuffle(idx);
      const scene = pools[idx][orders[idx].shift() as number];
      levelIdx = (levelIdx + 1) % pools.length;
      return scene;
    },
  };
};

export const createStudyCycle = <T>(opts: {
  pools: ReadonlyArray<ReadonlyArray<T>>;
  runScene: (scene: T) => Promise<void>;
}) => {
  const rotation = createLevelRotation(opts.pools);
  let timer: number | undefined;
  let pausedByHover = false;
  let suspendedUntil = 0;

  const isPaused = () => pausedByHover || Date.now() < suspendedUntil;

  const cycle = async () => {
    if (isPaused()) return;
    await opts.runScene(rotation.next());
    scheduleNext();
  };

  const scheduleNext = (delay = CYCLE_DELAY_MS) => {
    if (isPaused()) return;
    timer = window.setTimeout(cycle, delay);
  };

  const cancel = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };

  return {
    /** Schedule the next auto-cycle study, unless paused. */
    scheduleNext,
    /** Cancel any pending auto-cycle study. */
    cancel,
    /**
     * Schedule even while hover-paused (the fire-time pause check
     * still applies). Used after a user-initiated study where the
     * pointer is likely still over the map.
     */
    forceSchedule(delay: number) {
      cancel();
      timer = window.setTimeout(cycle, delay);
    },
    /**
     * Suppress auto-cycling for `ms`. Timestamped (rather than a
     * boolean) so it survives focusin/focusout churn — used when the
     * user explicitly fires a study via search and the cycle should
     * back off long enough for them to read the result.
     */
    suspendFor(ms: number) {
      suspendedUntil = Date.now() + ms;
      cancel();
    },
    /**
     * Pause while the workspace is hovered or focused. The current
     * study is allowed to finish; the next one waits until the
     * pause lifts.
     */
    setHoverPaused(paused: boolean) {
      if (paused) {
        pausedByHover = true;
        cancel();
        return;
      }
      if (!pausedByHover) return;
      pausedByHover = false;
      if (timer === undefined) scheduleNext(RESUME_DELAY_MS);
    },
  };
};
