use std::io::Cursor;

use crate::{animated::image_animated_decoder_to_img, exif, ImageDecoder};

#[derive(Debug)]
pub struct WebpDecoder;

impl ImageDecoder for WebpDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<crate::ImageEgg<'a>> {
    let exif = exif::extract_webp_payload(buffer);
    let webp = image::codecs::webp::WebPDecoder::new(Cursor::new(buffer))?;
    let has_animation = webp.has_animation();
    let mut image = image_animated_decoder_to_img(webp, has_animation, Ok)?;
    image.exif = exif;
    Ok(image)
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGEncoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::WebpDecoder;

  fn webp_to_png(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = WebpDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = PNGEncoder;

    let png_buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &png_buffer);
  }

  #[test]
  fn test_decode_webp() {
    webp_to_png(
      "webp/stripe.webp",
      "webp/output/stripe.png",
    );

    webp_to_png(
      "webp/clock.webp",
      "webp/output/clock.png",
    );
  }
}
