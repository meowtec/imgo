use crate::{ImageEgg, ImageEncoder, OptimizeOptions};

#[derive(Debug)]
pub struct GifEncoder;

impl ImageEncoder for GifEncoder {
  fn encode(&self, image: ImageEgg<'_>, _options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let mut buffer = Vec::new();
    let mut encoder = image::codecs::gif::GifEncoder::new(&mut buffer);

    encoder.set_repeat(match image.loop_count {
      0 => image::codecs::gif::Repeat::Infinite,
      other => image::codecs::gif::Repeat::Finite(other as u16),
    })?;

    encoder.try_encode_frames(image.frames_iter.map(|frame| {
      let frame = frame.map_err(|err| {
        image::ImageError::Decoding(image::error::DecodingError::new(
          image::error::ImageFormatHint::Unknown,
          err,
        ))
      })?;
      let delay = frame.delay;
      let rgba = match frame.image {
        image::DynamicImage::ImageRgba8(rgba) => rgba,
        other => other.to_rgba8(),
      };
      Ok(image::Frame::from_parts(
        rgba, 0, 0, delay,
      ))
    }))?;

    drop(encoder);

    Ok(buffer)
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::GifEncoder;

  fn png_to_gif(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = GifEncoder;
    let buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &buffer);
  }

  #[test]
  fn test_encode_gif() {
    png_to_gif(
      "png/dice-transparent.png",
      "png/output/dice-transparent.gif",
    );

    png_to_gif(
      "apng/clock-8bit.png",
      "apng/output/clock.gif",
    );
  }
}
