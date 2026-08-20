use anyhow::anyhow;

use crate::ImageDecoder;

#[derive(Debug)]
pub struct JxlDecoder;

impl ImageDecoder for JxlDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<crate::ImageEgg<'a>> {
    use jpegxl_rs::image::ToDynamic;

    let decoder = jpegxl_rs::decoder_builder().build()?;

    let result = decoder.decode_to_image(buffer)?.ok_or(anyhow!(
      "no image or unsupported jxl data type",
    ))?;

    Ok(result.into())
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGEncoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::JxlDecoder;

  fn jxl_to_png(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = JxlDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = PNGEncoder;

    let png_buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &png_buffer);
  }

  #[test]
  fn test_decode_jxl() {
    jxl_to_png(
      "jxl/sunset.jxl",
      "jxl/output/sunset.png",
    );

    jxl_to_png(
      "jxl/dice-transparent.jxl",
      "jxl/output/dice-transparent.png",
    );
  }
}
