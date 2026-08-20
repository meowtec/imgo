use std::io::Cursor;

use crate::{animated::image_animated_decoder_to_img, ImageDecoder};

#[derive(Debug)]
pub struct GifDecoder;

impl ImageDecoder for GifDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<crate::ImageEgg<'a>> {
    let decoder = image::codecs::gif::GifDecoder::new(Cursor::new(buffer))?;
    image_animated_decoder_to_img(decoder, true, Ok)
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGEncoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::GifDecoder;

  fn gif_to_png(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = GifDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = PNGEncoder;

    let png_buffer = encoder
      .encode(
        image,
        OptimizeOptions {
          indexed: Some(true),
          quality: 30,
          ..Default::default()
        },
      )
      .unwrap();
    write_samples_file_buffer(output, &png_buffer);
  }

  #[test]
  fn test_decode_gif() {
    gif_to_png(
      "gif/yaoren.gif",
      "gif/output/yaoren.png",
    );

    gif_to_png("gif/clock.gif", "gif/output/clock.png");
  }
}
