const FORMAT_CURVES = {
  webp: [
    { quality: 0, nativeQuality: 0 },
    { quality: 30, nativeQuality: 25, power: 1.9 },
    { quality: 60, nativeQuality: 60, power: 1.15 },
    { quality: 100, nativeQuality: 100, power: 0.8 },
  ],
  heif: [
    { quality: 0, nativeQuality: 0 },
    { quality: 30, nativeQuality: 29, power: 0.5 },
    { quality: 60, nativeQuality: 39, power: 1 },
    { quality: 100, nativeQuality: 70, power: 1.6 },
  ],
  avif: [
    { quality: 0, nativeQuality: 0 },
    { quality: 30, nativeQuality: 37, power: 0.5 },
    { quality: 60, nativeQuality: 51, power: 1 },
    { quality: 100, nativeQuality: 100, power: 1.5 },
  ],
  jxl: [
    { quality: 0, nativeQuality: 0 },
    { quality: 30, nativeQuality: 32, power: 1.15 },
    { quality: 60, nativeQuality: 65, power: 1 },
    { quality: 100, nativeQuality: 95, power: 0.95 },
  ],
  jpg: [
    { quality: 0, nativeQuality: 0 },
    { quality: 30, nativeQuality: 32, power: 0.6 },
    { quality: 60, nativeQuality: 62, power: 1 },
    { quality: 100, nativeQuality: 100, power: 0.8 },
  ],
};

function clampQuality(quality) {
  return Math.max(0, Math.min(100, Number(quality) || 0));
}

function interpolateSegment(left, right, quality) {
  const span = right.quality - left.quality;
  if (span <= 0) {
    return right.nativeQuality;
  }

  const progress = Math.max(0, Math.min(1, (quality - left.quality) / span));
  const poweredProgress = progress ** (right.power ?? 1);
  return left.nativeQuality + (right.nativeQuality - left.nativeQuality) * poweredProgress;
}

/**
 * Converts public quality to a continuous format-specific native quality.
 *
 * The curve is split into 0-30, 30-60, and 60-100 sections so low, middle,
 * and high quality ranges can be calibrated independently.
 */
export function normalizeQuality(format, quality) {
  const normalizedQuality = clampQuality(quality);
  const curve = FORMAT_CURVES[format];
  if (Array.isArray(curve) === false || curve.length === 0) {
    return normalizedQuality;
  }

  for (let index = 1; index < curve.length; index += 1) {
    const right = curve[index];
    if (normalizedQuality <= right.quality) {
      return clampQuality(interpolateSegment(curve[index - 1], right, normalizedQuality));
    }
  }

  return clampQuality(curve[curve.length - 1].nativeQuality);
}

export const SUPPORTED_NORMALIZATION_FORMATS = Object.keys(FORMAT_CURVES);
