use std::io::Cursor;

use anyhow::Context;

use crate::{animated::image_animated_decoder_to_img, exif, ImageDecoder, ImageEgg};

#[derive(Debug)]
pub struct PNGDecoder;

fn read_exif(buffer: &[u8]) -> Option<Vec<u8>> {
  let png = png::Decoder::new(Cursor::new(buffer));
  let reader = png.read_info().ok()?;

  reader
    .info()
    .exif_metadata
    .as_ref()
    .and_then(|exif| exif::normalize_payload(exif.as_ref()))
}

impl ImageDecoder for PNGDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<ImageEgg<'a>> {
    let exif = read_exif(buffer);
    let png = image::codecs::png::PngDecoder::new(Cursor::new(buffer))?;
    let is_animated = png.is_apng()?;
    let mut image = image_animated_decoder_to_img(png, is_animated, |png| {
      png
        .apng()
        .with_context(|| "png decoder to apng decoder failed")
    })?;
    image.exif = exif;
    Ok(image)
  }
}

#[cfg(test)]
mod tests {
  use crate::{test_utils::test_utils::read_samples_file_buffer, ImageDecoder, ImageFrame};

  use super::PNGDecoder;

  fn decode_work(path: &str, width: u32, height: u32, length: usize) {
    let buffer = read_samples_file_buffer(path);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();
    assert_eq!(image.width, width);
    assert_eq!(image.height, height);
    let frames: Vec<ImageFrame> = image.frames_iter.collect::<Result<Vec<_>, _>>().unwrap();
    assert_eq!(frames.len(), length);
  }

  #[test]
  fn it_decode_png() {
    decode_work("png/dice-transparent.png", 560, 420, 1);
  }

  #[test]
  fn it_decode_apng() {
    decode_work("apng/clock-8bit.png", 150, 150, 40);
  }
}
