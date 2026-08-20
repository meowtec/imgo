use std::io::Cursor;

use crate::{format::ImageFormat, ImageEgg, ImageEncoder, OptimizeOptions};

#[derive(Debug)]
pub struct GenericEncoder {
  format: ImageFormat,
}

impl GenericEncoder {
  pub fn new(format: ImageFormat) -> Self {
    Self { format }
  }
}

impl ImageEncoder for GenericEncoder {
  fn encode(&self, image: ImageEgg<'_>, _options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let mut buffer = Vec::new();
    let img = image.into_single_image()?;
    let image_format: image::ImageFormat = self.format.try_into()?;
    img.write_to(
      &mut Cursor::new(&mut buffer),
      image_format,
    )?;

    Ok(buffer)
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    format::ImageFormat,
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::GenericEncoder;

  fn png_to_jpeg(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = GenericEncoder {
      format: ImageFormat::Jpeg,
    };
    let buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &buffer);
  }

  #[test]
  fn test_encode_jpeg() {
    png_to_jpeg(
      "png/leaves.png",
      "png/output/leaves-generic.jpeg",
    );
  }
}
