use libheif_rs::{HeifContext, LibHeif};

use crate::{exif, img::RgbImage, ImageEgg, ImageEncoder, OptimizeOptions};

fn copy_rgb_buffer_to_plane(
  buffer: &[u8],
  interleaved_plane: &mut libheif_rs::Plane<&mut [u8]>,
  bytes_per_pixel: u8, // only 3 or 4 are supported
) {
  let stride = interleaved_plane.stride;
  let width = interleaved_plane.width as usize;
  let height = interleaved_plane.height as usize;
  let line_size = width * bytes_per_pixel as usize;

  for y in 0..height {
    let src_offset = y * line_size;
    let dst_offset = y * stride;
    let src_slice = &buffer[src_offset..src_offset + line_size];
    let dst_slice = &mut interleaved_plane.data[dst_offset..(dst_offset + line_size)];
    dst_slice.copy_from_slice(src_slice);
  }
}

#[derive(Debug)]
pub struct HeifEncoder;

impl ImageEncoder for HeifEncoder {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let single = image.into_single()?;
    let exif = options
      .preserve_metadata_enabled()
      .then(|| {
        single
          .exif
          .as_deref()
          .and_then(|exif| exif::patched_payload(exif, single.width, single.height))
      })
      .flatten();
    let image = single.image;
    let height = single.height;
    let width = single.width;

    let rgb_image = RgbImage::from(&image);

    let rgb_chroma = match rgb_image {
      RgbImage::Rgb8(_) => libheif_rs::RgbChroma::Rgb,
      RgbImage::Rgba8(_) => libheif_rs::RgbChroma::Rgba,
    };

    let mut heif_image = libheif_rs::Image::new(
      width,
      height,
      libheif_rs::ColorSpace::Rgb(rgb_chroma),
    )?;

    heif_image.create_plane(
      libheif_rs::Channel::Interleaved,
      width,
      height,
      8,
    )?;

    let planes = heif_image.planes_mut();
    let mut interleaved_plane = planes
      .interleaved
      .ok_or_else(|| anyhow::anyhow!("interleaved plane is missing"))?;

    copy_rgb_buffer_to_plane(
      rgb_image.as_raw(),
      &mut interleaved_plane,
      rgb_image.bytes_per_pixel(),
    );

    let lib_heif = LibHeif::new();
    let mut context = HeifContext::new()?;
    let mut encoder = lib_heif.encoder_for_format(libheif_rs::CompressionFormat::Hevc)?;
    encoder.set_quality(if options.lossless_enabled() {
      libheif_rs::EncoderQuality::LossLess
    } else {
      libheif_rs::EncoderQuality::Lossy(options.quality)
    })?;
    let handle = context.encode_image(&heif_image, &mut encoder, None)?;

    if let Some(exif) = exif {
      context.add_exif_metadata(&handle, &exif)?;
    }

    let buffer = context.write_to_bytes()?;

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

  use super::HeifEncoder;

  fn png_to_heic(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = HeifEncoder;
    let buffer = encoder.encode(image, OptimizeOptions::default()).unwrap();
    write_samples_file_buffer(output, &buffer);
  }

  #[test]
  fn test_encode_heic() {
    png_to_heic(
      "png/dice-transparent.png",
      "png/output/dice-transparent.heic",
    );

    png_to_heic(
      "png/leaves.png",
      "png/output/leaves.heic",
    );

    png_to_heic("apng/o-24bit.png", "apng/output/o.heic");
  }
}
