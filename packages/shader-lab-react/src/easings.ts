export const easings = {
  easeInOutCubic: (x: number): number =>
    x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2,
}

/**
 * Evaluate a cubic bezier easing curve.
 * Control points: [x1, y1, x2, y2] (CSS cubic-bezier format).
 */
export function evaluateCubicBezier(
  progress: number,
  cp: [number, number, number, number],
): number {
  if (progress <= 0) return 0
  if (progress >= 1) return 1

  const [x1, y1, x2, y2] = cp

  if (x1 === 0 && y1 === 0 && x2 === 1 && y2 === 1) return progress

  let tLow = 0
  let tHigh = 1
  let t = progress

  for (let i = 0; i < 20; i++) {
    const mt = 1 - t
    const mt2 = mt * mt
    const t2 = t * t
    const bx = 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t2 * t

    if (Math.abs(bx - progress) < 1e-6) break

    if (bx < progress) tLow = t
    else tHigh = t
    t = (tLow + tHigh) / 2
  }

  const mt = 1 - t
  const mt2 = mt * mt
  const t2 = t * t
  return 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t2 * t
}
