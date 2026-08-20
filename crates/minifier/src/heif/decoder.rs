use anyhow::anyhow;
use image::Delay;
use libheif_rs::{HeifContext, LibHeif};
use minifier_utils::DelayExt;

use crate::{exif, ImageDecoder, ImageEgg, ImageFrame};

#[derive(Debug)]
pub struct HeifDecoder;

fn rgba_plane_to_buffer(plane: &libheif_rs::Plane<&[u8]>) -> Vec<u8> {
  let stride = plane.stride;
  let width = plane.width as usize;
  let height = plane.height as usize;
  let line_size = width * 4;

  let mut buffer = vec![0; width * height * 4];

  for y in 0..height {
    let src_offset = y * stride;
    let dst_offset = y * line_size;
    let src_slice = &plane.data[src_offset..src_offset + line_size];
    let dst_slice = &mut buffer[dst_offset..(dst_offset + line_size)];
    dst_slice.copy_from_slice(src_slice);
  }

  buffer
}

impl ImageDecoder for HeifDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<ImageEgg<'a>> {
    let ctx = HeifContext::read_from_bytes(buffer)?;
    let image_handle = ctx.primary_image_handle()?;
    let mut metadata_ids = [0; 1];
    let exif = (image_handle.metadata_block_ids(&mut metadata_ids, b"Exif") > 0)
      .then(|| image_handle.metadata(metadata_ids[0]).ok())
      .flatten()
      .and_then(|payload| exif::normalize_payload(&payload));

    let lib_heif = LibHeif::new();

    let image = lib_heif.decode(
      &image_handle,
      libheif_rs::ColorSpace::Rgb(libheif_rs::RgbChroma::Rgba),
      None,
    )?;

    let planes = image.planes();

    let interleaved_plane = planes
      .interleaved
      .ok_or_else(|| anyhow!("can not get interleaved plane",))?;

    let buffer = rgba_plane_to_buffer(&interleaved_plane);

    let frame = ImageFrame::from_rgba_raw(
      buffer,
      interleaved_plane.width,
      interleaved_plane.height,
      Delay::zero(),
    )?;

    Ok(ImageEgg {
      is_animated: false,
      width: frame.image.width(),
      height: frame.image.height(),
      loop_count: 0,
      frames_iter: Box::new(std::iter::once(Ok(frame))),
      exif,
    })
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGEncoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::HeifDecoder;

  fn heic_to_png(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = HeifDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = PNGEncoder;
    let png_buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &png_buffer);
  }

  #[test]
  fn test_decode_heic() {
    heic_to_png(
      "heif/sample1.heic",
      "heif/output/sample1.png",
    );

    heic_to_png(
      "heif/31x31.heic",
      "heif/output/31x31.png",
    );
  }
}
