use crate::types::ImageFormat;

/// A single anchor on a format's quality calibration curve.
struct CurvePoint {
  /// Public quality at this anchor (0-100).
  quality: f64,
  /// Format-specific native quality this anchor maps to.
  native_quality: f64,
  /// Easing exponent applied across the segment ending at this anchor
  /// (`1.0` is linear). The exponent on the first anchor is unused.
  power: f64,
}

macro_rules! curve_point {
  ($quality:expr, $native:expr) => {
    CurvePoint {
      quality: $quality,
      native_quality: $native,
      power: 1.0,
    }
  };
  ($quality:expr, $native:expr, $power:expr) => {
    CurvePoint {
      quality: $quality,
      native_quality: $native,
      power: $power,
    }
  };
}

// The curves split the range into 0-30, 30-60, and 60-100 sections so the low,
// middle, and high quality bands can be calibrated independently. Values are
// kept in sync with `benchmark/quality-normalize.js`.
static WEBP_CURVE: [CurvePoint; 4] = [
  curve_point!(0.0, 0.0),
  curve_point!(30.0, 25.0, 1.9),
  curve_point!(60.0, 60.0, 1.15),
  curve_point!(100.0, 100.0, 0.8),
];

static HEIF_CURVE: [CurvePoint; 4] = [
  curve_point!(0.0, 0.0),
  curve_point!(30.0, 29.0, 0.5),
  curve_point!(60.0, 39.0, 1.0),
  curve_point!(100.0, 70.0, 1.6),
];

static AVIF_CURVE: [CurvePoint; 4] = [
  curve_point!(0.0, 0.0),
  curve_point!(30.0, 37.0, 0.5),
  curve_point!(60.0, 51.0, 1.0),
  curve_point!(100.0, 100.0, 1.5),
];

static JXL_CURVE: [CurvePoint; 4] = [
  curve_point!(0.0, 0.0),
  curve_point!(30.0, 32.0, 1.15),
  curve_point!(60.0, 65.0, 1.0),
  curve_point!(100.0, 95.0, 0.95),
];

static JPG_CURVE: [CurvePoint; 4] = [
  curve_point!(0.0, 0.0),
  curve_point!(30.0, 32.0, 0.6),
  curve_point!(60.0, 62.0, 1.0),
  curve_point!(100.0, 100.0, 0.8),
];

fn curve_for_format(format: ImageFormat) -> Option<&'static [CurvePoint]> {
  match format {
    ImageFormat::WebP => Some(&WEBP_CURVE),
    ImageFormat::Heic => Some(&HEIF_CURVE),
    ImageFormat::Avif => Some(&AVIF_CURVE),
    ImageFormat::Jxl => Some(&JXL_CURVE),
    ImageFormat::Jpeg => Some(&JPG_CURVE),
    _ => None,
  }
}

fn clamp_quality(quality: f64) -> f64 {
  quality.clamp(0.0, 100.0)
}

fn interpolate_segment(left: &CurvePoint, right: &CurvePoint, quality: f64) -> f64 {
  let span = right.quality - left.quality;
  if span <= 0.0 {
    return right.native_quality;
  }

  let progress = ((quality - left.quality) / span).clamp(0.0, 1.0);
  let powered_progress = progress.powf(right.power);
  left.native_quality + (right.native_quality - left.native_quality) * powered_progress
}

/// Converts a public quality (0-100) to a continuous format-specific native
/// quality, then rounds it to the `u8` range the encoders consume.
///
/// Formats without a calibration curve (PNG, GIF, ...) pass the clamped quality
/// through unchanged.
pub fn normalize_quality(format: ImageFormat, quality: u8) -> u8 {
  let normalized_quality = clamp_quality(quality as f64);
  let curve = match curve_for_format(format) {
    Some(curve) => curve,
    None => return normalized_quality.round() as u8,
  };

  for index in 1..curve.len() {
    let right = &curve[index];
    if normalized_quality <= right.quality {
      let native = interpolate_segment(
        &curve[index - 1],
        right,
        normalized_quality,
      );
      return clamp_quality(native).round() as u8;
    }
  }

  match curve.last() {
    Some(point) => clamp_quality(point.native_quality).round() as u8,
    None => normalized_quality.round() as u8,
  }
}

#[cfg(test)]
mod tests {
  use super::normalize_quality;
  use crate::types::ImageFormat;

  #[test]
  fn maps_curve_anchors() {
    assert_eq!(
      normalize_quality(ImageFormat::WebP, 0),
      0
    );
    assert_eq!(
      normalize_quality(ImageFormat::WebP, 30),
      25
    );
    assert_eq!(
      normalize_quality(ImageFormat::WebP, 60),
      60
    );
    assert_eq!(
      normalize_quality(ImageFormat::WebP, 100),
      100
    );

    assert_eq!(
      normalize_quality(ImageFormat::Heic, 60),
      39
    );
    assert_eq!(
      normalize_quality(ImageFormat::Heic, 100),
      70
    );

    assert_eq!(
      normalize_quality(ImageFormat::Avif, 30),
      37
    );
    assert_eq!(
      normalize_quality(ImageFormat::Avif, 100),
      100
    );

    assert_eq!(
      normalize_quality(ImageFormat::Jxl, 30),
      32
    );
    assert_eq!(
      normalize_quality(ImageFormat::Jxl, 100),
      95
    );

    assert_eq!(
      normalize_quality(ImageFormat::Jpeg, 60),
      62
    );
  }

  #[test]
  fn interpolates_within_segment() {
    // Halfway through webp's 30-60 segment (power 1.15) stays between anchors.
    let mid = normalize_quality(ImageFormat::WebP, 45);
    assert!(
      mid > 25 && mid < 60,
      "unexpected midpoint value: {}",
      mid
    );
  }

  #[test]
  fn passes_through_formats_without_curve() {
    assert_eq!(
      normalize_quality(ImageFormat::Png, 42),
      42
    );
    assert_eq!(
      normalize_quality(ImageFormat::Gif, 73),
      73
    );
  }

  #[test]
  fn clamps_out_of_range_quality() {
    assert_eq!(
      normalize_quality(ImageFormat::WebP, 255),
      100
    );
    assert_eq!(
      normalize_quality(ImageFormat::Png, 200),
      100
    );
  }
}
