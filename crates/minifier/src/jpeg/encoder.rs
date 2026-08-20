use std::io;

use anyhow::anyhow;
use image::{ImageBuffer, Rgb, Rgba};

use crate::{exif, ImageEgg, ImageEncoder, OptimizeOptions};

#[derive(Debug)]
pub struct JpegEncoder;

// rgba pixel to rgb with white background
fn pixel_rgba_to_rgb(rgba: &Rgba<u8>) -> Rgb<u8> {
  let alpha = rgba.0[3];

  Rgb([
    u8::MAX - (alpha as u16 * (u8::MAX - rgba.0[0]) as u16 / u8::MAX as u16) as u8,
    u8::MAX - (alpha as u16 * (u8::MAX - rgba.0[1]) as u16 / u8::MAX as u16) as u8,
    u8::MAX - (alpha as u16 * (u8::MAX - rgba.0[2]) as u16 / u8::MAX as u16) as u8,
  ])
}

fn image_rgba_to_rgb(rgba: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> ImageBuffer<Rgb<u8>, Vec<u8>> {
  let (width, height) = rgba.dimensions();
  let mut out = ImageBuffer::new(width, height);
  for (x, y, pixel) in rgba.enumerate_pixels() {
    out.put_pixel(x, y, pixel_rgba_to_rgb(pixel));
  }
  out
}

impl ImageEncoder for JpegEncoder {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let single = image.into_single()?;
    let exif = options
      .preserve_metadata_enabled()
      .then(|| {
        single
          .exif
          .as_deref()
          .and_then(|exif| exif::jpeg_app1_payload(exif, single.width, single.height))
      })
      .flatten();
    let img = single.image;

    let encode_result = std::panic::catch_unwind(|| {
      let mut comp = mozjpeg::Compress::new(mozjpeg::ColorSpace::JCS_RGB);
      let vec = Vec::new();

      comp.set_size(
        img.width() as usize,
        img.height() as usize,
      );
      comp.set_quality(options.quality.into());
      let mut comp = comp.start_compress(vec)?;

      if let Some(exif) = exif {
        comp.write_marker(mozjpeg::Marker::APP(1), &exif);
      }

      let rgb8 = match img {
        image::DynamicImage::ImageRgb8(rgb8) => rgb8,
        image::DynamicImage::ImageRgba8(rgba8) => image_rgba_to_rgb(&rgba8),
        _ => image_rgba_to_rgb(&img.to_rgba8()),
      };
      comp.write_scanlines(rgb8.as_raw())?;

      let writer = comp.finish()?;

      Ok::<Vec<u8>, io::Error>(writer)
    });

    match encode_result {
      Ok(result) => result.map_err(|err| err.into()),
      Err(_) => Err(anyhow!("mozjpeg unwind panic!",)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::JpegEncoder;

  fn png_to_jpeg(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = JpegEncoder;
    let buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &buffer);
  }

  #[test]
  fn test_encode_jpeg() {
    png_to_jpeg(
      "png/leaves.png",
      "png/output/leaves.jpeg",
    );

    png_to_jpeg(
      "apng/stripe.png",
      "apng/output/stripe.jpeg",
    );
  }
}
