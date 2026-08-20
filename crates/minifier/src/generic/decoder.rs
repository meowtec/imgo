use crate::{exif, ImageDecoder};

#[derive(Debug)]
pub struct GenericDecoder;

impl ImageDecoder for GenericDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<crate::ImageEgg<'a>> {
    let img = image::load_from_memory(buffer)?;
    let exif = exif::extract_jpeg_payload(buffer);
    let mut image: crate::ImageEgg = img.into();
    image.exif = exif;

    Ok(image)
  }
}

#[cfg(test)]
mod tests {
  use crate::{test_utils::test_utils::read_samples_file_buffer, ImageDecoder, ImageFrame};

  use super::GenericDecoder;

  fn decode_work(path: &str, width: u32, height: u32, length: usize) {
    let buffer = read_samples_file_buffer(path);
    let decoder = GenericDecoder;
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
    // not support animated
    decode_work("apng/clock-8bit.png", 150, 150, 1);
  }
}
