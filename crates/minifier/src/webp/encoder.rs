use anyhow::anyhow;
use minifier_utils::DelayExt;
use webp::AnimFrame;

use crate::{img::RgbImage, ImageEgg, ImageEncoder, OptimizeOptions};

#[derive(Debug)]
pub struct WebpEncoder;

impl ImageEncoder for WebpEncoder {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    fn webp_error_to_anyhow<T: std::fmt::Debug>(err: T) -> anyhow::Error {
      anyhow!("webp encoding fail: {:?}", err)
    }

    let mut webp_config =
      webp::WebPConfig::new().map_err(|_| anyhow!("Can not create webp config"))?;
    webp_config.quality = options.quality as f32;
    webp_config.lossless = if options.lossless_enabled() { 1 } else { 0 };

    if options.fastest == Some(true) {
      webp_config.pass = 1;
    }

    let memory = if image.is_animated {
      let mut encoder = webp::AnimEncoder::new(image.width, image.height, &webp_config);
      let mut timestamp_ns: u64 = 0;

      for frame in image.frames_iter {
        let frame = frame?;
        let delay_ns = frame.delay.nanoseconds();
        let img = frame.image;
        let width = img.width();
        let height = img.height();

        let timestamp = (timestamp_ns / 1_000_000) as u32 as i32;

        let rgb_image = RgbImage::from(&img);

        let layout = match rgb_image {
          RgbImage::Rgb8(_) => webp::PixelLayout::Rgb,
          RgbImage::Rgba8(_) => webp::PixelLayout::Rgba,
        };
        let webp_frame: AnimFrame = AnimFrame::new(
          rgb_image.as_raw(),
          layout,
          width,
          height,
          timestamp,
          None,
        );

        timestamp_ns += delay_ns;
        encoder
          .add_frame(webp_frame)
          .map_err(webp_error_to_anyhow)?;
      }

      encoder.try_encode().map_err(webp_error_to_anyhow)?
    } else {
      let img = image.into_single_image()?;
      let encoder = webp::Encoder::from_image(&img).map_err(webp_error_to_anyhow)?;
      encoder
        .encode_advanced(&webp_config)
        .map_err(webp_error_to_anyhow)?
    };

    Ok(memory.to_vec())
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::WebpEncoder;

  fn png_to_webp(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = WebpEncoder;
    let buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &buffer);
  }

  #[test]
  fn test_encode_webp() {
    png_to_webp(
      "png/dice-transparent.png",
      "png/output/dice-transparent.webp",
    );

    png_to_webp(
      "apng/clock-8bit.png",
      "apng/output/clock.webp",
    );

    png_to_webp(
      "apng/stripe.png",
      "apng/output/stripe.webp",
    );

    png_to_webp("apng/o-24bit.png", "apng/output/o.webp");
  }
}
