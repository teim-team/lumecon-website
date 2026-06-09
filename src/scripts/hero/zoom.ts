/**
 * viewBox zoom tween for the hero map SVG.
 *
 * The frontmatter VBX/VBY/VBW/VBH constants are baked into the
 * initial viewBox attribute; createZoom() reads them back at runtime
 * so the client doesn't need the server constants.
 */
import { easeInOut } from './anim';

export const createZoom = (svgEl: SVGSVGElement | null) => {
  const initialVB = (svgEl?.getAttribute('viewBox') || '-60 5 1020 610').split(/\s+/).map(Number);
  const overviewVB = [initialVB[0], initialVB[1], initialVB[2], initialVB[3]] as [
    number,
    number,
    number,
    number,
  ];
  let zoomFrame: number | undefined;
  const setVB = (vb: [number, number, number, number]) => {
    svgEl?.setAttribute('viewBox', vb.join(' '));
  };

  /**
   * Tween the SVG viewBox from its current value to `target` over
   * `dur` ms with an ease-in-out curve. Cancels any in-flight zoom
   * so successive calls don't fight each other.
   *
   * @param target Final viewBox as [x, y, width, height].
   * @param dur Duration in milliseconds.
   * @returns Promise that resolves when the tween completes.
   */
  const tweenVB = (target: [number, number, number, number], dur = 700) => {
    if (!svgEl) return Promise.resolve();
    const cur = (svgEl.getAttribute('viewBox') || overviewVB.join(' '))
      .split(/\s+/)
      .map(Number) as [number, number, number, number];
    const t0 = performance.now();
    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = easeInOut(t);
        const next: [number, number, number, number] = [
          cur[0] + (target[0] - cur[0]) * e,
          cur[1] + (target[1] - cur[1]) * e,
          cur[2] + (target[2] - cur[2]) * e,
          cur[3] + (target[3] - cur[3]) * e,
        ];
        setVB(next);
        if (t < 1) zoomFrame = requestAnimationFrame(step);
        else resolve();
      };
      if (zoomFrame) cancelAnimationFrame(zoomFrame);
      zoomFrame = requestAnimationFrame(step);
    });
  };

  /**
   * Zoom into a source point. The detail viewBox is centered on the
   * source with a small margin. Zoom level depends on the geography
   * size — tribal-land detail wants tighter zoom than state-level.
   *
   * @param cx Center X in SVG coords.
   * @param cy Center Y in SVG coords.
   * @param span Width of the zoomed viewBox. Smaller = tighter zoom.
   */
  const zoomTo = (cx: number, cy: number, span = 200) => {
    const w = span;
    const h = span * (overviewVB[3] / overviewVB[2]);
    return tweenVB([cx - w / 2, cy - h / 2, w, h], 800);
  };

  /** Restore the map to its overview viewBox. */
  const zoomOut = () => tweenVB(overviewVB, 700);

  return { zoomTo, zoomOut };
};
