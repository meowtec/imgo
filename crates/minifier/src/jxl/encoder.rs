use crate::{img::RgbImage, ImageEgg, ImageEncoder, OptimizeOptions};

const MAX_LOSSY_QUALITY: u8 = 99;

/// Quality from 0 to 100 is common for most formats, but JXL uses a different scale:
///    Range: 0 .. 25.
///    0.0 = mathematically lossless (however, use `lossless` to use true lossless).
///    1.0 = visually lossless.
///    Recommended range: 0.5 .. 3.0.
///    Default value: 1.0.
/// This transform converts from the 0 .. 100 range to the 0 .. 25 range.
/// In lossy mode we clamp the caller-facing q100 to the highest supported
/// lossy setting, because distance=0 must be paired with explicit lossless
/// encoding in libjxl.
/// See https://github.com/libjxl/libjxl/blob/main/tools/cjxl_main.cc
fn transform_quality(q: u8) -> f32 {
  let quality = q.min(MAX_LOSSY_QUALITY) as f32;
  if quality >= 30.0 {
    0.1 + (100.0 - quality) * 0.09
  } else {
    53.0 / 3000.0 * quality * quality - 23.0 / 20.0 * quality + 25.0
  }
}

#[derive(Debug)]
pub struct JxlEncoder;

impl JxlEncoder {
  pub fn encode_jpeg_losslessly(buffer: &[u8]) -> anyhow::Result<Vec<u8>> {
    let mut encoder = jpegxl_rs::encoder_builder()
      .use_container(true)
      .uses_original_profile(true)
      .build()?;
    Ok(encoder.encode_jpeg(buffer)?.data)
  }
}

impl ImageEncoder for JxlEncoder {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let image = image.into_single_image()?;
    let width = image.width();
    let height = image.height();
    let rgb_image = RgbImage::from(&image);

    let mut encoder = jpegxl_rs::encoder_builder()
      .has_alpha(rgb_image.has_alpha())
      .build()?;

    if options.lossless_enabled() {
      encoder.lossless = Some(true);
      encoder.uses_original_profile = true;
    } else {
      encoder.quality = transform_quality(options.quality);
    }

    let frame = jpegxl_rs::encode::EncoderFrame::new(rgb_image.as_raw())
      .num_channels(if rgb_image.has_alpha() { 4 } else { 3 });

    // encoder.encode does not support alpha, use encode_frame instead.
    let result: jpegxl_rs::encode::EncoderResult<u8> =
      encoder.encode_frame(&frame, width, height)?;

    Ok(result.data)
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::{transform_quality, JxlEncoder};

  fn png_to_jxl(input: &str, output: &str, options: OptimizeOptions) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = JxlEncoder;
    let buffer = encoder.encode(image, options).unwrap();
    write_samples_file_buffer(output, &buffer);
  }

  #[test]
  fn test_encode_jxl() {
    png_to_jxl(
      "png/dice-transparent.png",
      "png/output/dice-transparent.jxl",
      OptimizeOptions::default(),
    );

    png_to_jxl(
      "png/leaves.png",
      "png/output/leaves.jxl",
      OptimizeOptions::default(),
    );

    png_to_jxl(
      "apng/o-24bit.png",
      "apng/output/o.jxl",
      OptimizeOptions::default(),
    );
  }

  #[test]
  fn normalize_q100_to_lossy_distance() {
    assert!(transform_quality(100) > 0.0);
    assert!((transform_quality(100) - transform_quality(99)).abs() < f32::EPSILON);
  }

  #[test]
  fn test_encode_jxl_q100_and_lossless() {
    png_to_jxl(
      "png/leaves.png",
      "png/output/leaves-q100.jxl",
      OptimizeOptions {
        quality: 100,
        ..Default::default()
      },
    );

    png_to_jxl(
      "png/leaves.png",
      "png/output/leaves-lossless.jxl",
      OptimizeOptions {
        quality: 100,
        lossless: Some(true),
        ..Default::default()
      },
    );
  }
}
