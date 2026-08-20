use crate::quality_curve;
use crate::types::{ImageFormat, OptimizeOptions};
use anyhow::anyhow;
use std::{convert::TryFrom, ffi::OsStr};

impl ImageFormat {
  pub fn detect_from_extension(ext: &OsStr) -> Option<ImageFormat> {
    let ext = ext.to_str()?.to_ascii_lowercase();

    // formats that image::ImageFormat doesn't support
    let format_extend = match ext.as_str() {
      "heic" => Some(ImageFormat::Heic),
      "jxl" => Some(ImageFormat::Jxl),
      _ => None,
    };

    if format_extend.is_some() {
      return format_extend;
    }

    image::ImageFormat::from_extension(ext)
      .and_then(|image_type| ImageFormat::try_from(image_type).ok())
  }

  pub fn extensions_str(&self) -> &'static str {
    match image::ImageFormat::try_from(*self) {
      Ok(format) => format.extensions_str()[0],
      Err(_) => match self {
        ImageFormat::Heic => "heic",
        ImageFormat::Jxl => "jxl",
        _ => "blob",
      },
    }
  }

  pub fn supports_lossless(&self) -> bool {
    matches!(
      self,
      ImageFormat::Png
        | ImageFormat::WebP
        | ImageFormat::Avif
        | ImageFormat::Heic
        | ImageFormat::Jxl
    )
  }
}

impl TryFrom<image::ImageFormat> for ImageFormat {
  type Error = anyhow::Error;

  fn try_from(value: image::ImageFormat) -> Result<Self, Self::Error> {
    match value {
      image::ImageFormat::Png => Ok(ImageFormat::Png),
      image::ImageFormat::Jpeg => Ok(ImageFormat::Jpeg),
      image::ImageFormat::Gif => Ok(ImageFormat::Gif),
      image::ImageFormat::WebP => Ok(ImageFormat::WebP),
      image::ImageFormat::Pnm => Ok(ImageFormat::Pnm),
      image::ImageFormat::Tiff => Ok(ImageFormat::Tiff),
      image::ImageFormat::Tga => Ok(ImageFormat::Tga),
      image::ImageFormat::Dds => Ok(ImageFormat::Dds),
      image::ImageFormat::Bmp => Ok(ImageFormat::Bmp),
      image::ImageFormat::Ico => Ok(ImageFormat::Ico),
      image::ImageFormat::Hdr => Ok(ImageFormat::Hdr),
      image::ImageFormat::OpenExr => Ok(ImageFormat::OpenExr),
      image::ImageFormat::Farbfeld => Ok(ImageFormat::Farbfeld),
      image::ImageFormat::Avif => Ok(ImageFormat::Avif),
      image::ImageFormat::Qoi => Ok(ImageFormat::Qoi),
      _ => Err(anyhow!(
        "Unsupported format: {:?}",
        value
      )),
    }
  }
}

impl TryFrom<ImageFormat> for image::ImageFormat {
  type Error = anyhow::Error;

  fn try_from(value: ImageFormat) -> Result<Self, Self::Error> {
    match value {
      ImageFormat::Png => Ok(image::ImageFormat::Png),
      ImageFormat::Jpeg => Ok(image::ImageFormat::Jpeg),
      ImageFormat::Gif => Ok(image::ImageFormat::Gif),
      ImageFormat::WebP => Ok(image::ImageFormat::WebP),
      ImageFormat::Pnm => Ok(image::ImageFormat::Pnm),
      ImageFormat::Tiff => Ok(image::ImageFormat::Tiff),
      ImageFormat::Tga => Ok(image::ImageFormat::Tga),
      ImageFormat::Dds => Ok(image::ImageFormat::Dds),
      ImageFormat::Bmp => Ok(image::ImageFormat::Bmp),
      ImageFormat::Ico => Ok(image::ImageFormat::Ico),
      ImageFormat::Hdr => Ok(image::ImageFormat::Hdr),
      ImageFormat::OpenExr => Ok(image::ImageFormat::OpenExr),
      ImageFormat::Farbfeld => Ok(image::ImageFormat::Farbfeld),
      ImageFormat::Avif => Ok(image::ImageFormat::Avif),
      ImageFormat::Qoi => Ok(image::ImageFormat::Qoi),
      _ => Err(anyhow!(
        "Unsupported format: {:?}",
        value
      )),
    }
  }
}

impl OptimizeOptions {
  fn new_with_quality(quality: u8) -> Self {
    Self {
      indexed: None,
      quality,
      lossless: None,
      preserve_metadata: None,
      resize: None,
      speed: None,
      fastest: None,
    }
  }

  pub fn lossless_enabled(&self) -> bool {
    self.lossless.unwrap_or(false)
  }

  pub fn normalized_quality(&self) -> u8 {
    self.quality.min(100)
  }

  pub fn preserve_metadata_enabled(&self) -> bool {
    self.preserve_metadata.unwrap_or(true)
  }

  pub fn normalized_for_format(mut self, format: ImageFormat) -> Self {
    let requested_lossless = self.lossless_enabled();
    let effective_lossless = requested_lossless && format.supports_lossless();

    self.quality = if requested_lossless {
      100
    } else {
      // Calibrate the public quality onto the format's native quality curve so
      // every lossy encoder sees the same perceptual level. Formats without a
      // curve (PNG, GIF, ...) pass the clamped quality through unchanged.
      quality_curve::normalize_quality(format, self.normalized_quality())
    };
    self.lossless = Some(effective_lossless);

    if effective_lossless && matches!(format, ImageFormat::Png) {
      // Palette quantization is lossy, so disable it for PNG lossless mode.
      self.indexed = Some(false);
    }

    self
  }
}

impl Default for OptimizeOptions {
  fn default() -> Self {
    Self::new_with_quality(85)
  }
}

#[cfg(test)]
mod tests {
  use crate::types::{ImageFormat, OptimizeOptions};

  #[test]
  fn normalize_quality_range() {
    let options = OptimizeOptions {
      quality: 255,
      ..Default::default()
    };

    assert_eq!(options.normalized_quality(), 100);
  }

  #[test]
  fn normalize_lossless_for_unsupported_format() {
    let options = OptimizeOptions {
      quality: 42,
      lossless: Some(true),
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::Jpeg);

    assert_eq!(options.quality, 100);
    assert_eq!(options.lossless, Some(false));
  }

  #[test]
  fn normalize_lossless_for_png_disables_indexed() {
    let options = OptimizeOptions {
      indexed: Some(true),
      quality: 42,
      lossless: Some(true),
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::Png);

    assert_eq!(options.quality, 100);
    assert_eq!(options.lossless, Some(true));
    assert_eq!(options.indexed, Some(false));
  }

  #[test]
  fn calibrates_quality_onto_format_curve() {
    // The kernel applies the calibration curve: public 60 for HEIC maps to
    // native 39, while AVIF 30 maps to native 37.
    let heic = OptimizeOptions {
      quality: 60,
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::Heic);
    assert_eq!(heic.quality, 39);

    let avif = OptimizeOptions {
      quality: 30,
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::Avif);
    assert_eq!(avif.quality, 37);

    let jpeg = OptimizeOptions {
      quality: 60,
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::Jpeg);
    assert_eq!(jpeg.quality, 62);
  }

  #[test]
  fn calibrate_passes_through_formats_without_curve() {
    let png = OptimizeOptions {
      quality: 42,
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::Png);
    assert_eq!(png.quality, 42);
  }

  #[test]
  fn calibrate_does_not_touch_lossless_quality() {
    let options = OptimizeOptions {
      quality: 42,
      lossless: Some(true),
      ..Default::default()
    }
    .normalized_for_format(ImageFormat::WebP);

    assert_eq!(options.quality, 100);
    assert_eq!(options.lossless, Some(true));
  }
}
