use std::{borrow::Cow, convert::identity};

use minifier_utils::{
  crop_bitmap, crop_bitmap_chunked, find_changed_rect, find_changed_rect_chunked, DelayExt,
  RatioSafeOps, Rect,
};
use png::BitDepth;

use crate::{img::RgbImage, Image, ImageEgg, ImageEncoder, ImageStatic, OptimizeOptions};

use super::quantize::PNGQuantData;

fn bit_depth_to_u8(bit_depth: BitDepth) -> u8 {
  match bit_depth {
    BitDepth::One => 1,
    BitDepth::Two => 2,
    BitDepth::Four => 4,
    BitDepth::Eight => 8,
    BitDepth::Sixteen => 16,
  }
}

fn encode_indexes(width: u32, height: u32, indexes: &[u8], bit_depth: BitDepth) -> Vec<u8> {
  let bit_depth_u8: u8 = bit_depth_to_u8(bit_depth);
  let pixels_per_byte = 8 / bit_depth_u8;

  let col_bytes = (width as usize * bit_depth_u8 as usize + 7) / 8;

  let mut indexed_data = Vec::with_capacity(col_bytes * height as usize);

  for row in 0..height {
    for col_byte_index in 0..col_bytes {
      let mut col_byte = 0;
      for pixel in 0..pixels_per_byte {
        let col = col_byte_index * pixels_per_byte as usize + pixel as usize;
        if col < width as usize {
          let index = indexes[row as usize * width as usize + col];
          col_byte |= index << ((pixels_per_byte - pixel - 1) * bit_depth_u8);
        }
      }
      indexed_data.push(col_byte);
    }
  }

  indexed_data
}

#[derive(Debug)]
pub struct PNGEncoder;

enum PNGIndexesOrRGBAs<'a> {
  Rgba(Vec<RgbImage<'a>>),
  Indexes(PNGQuantData),
}

impl ImageEncoder for PNGEncoder {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let image_static: ImageStatic = image.try_into()?;
    let exif = options
      .preserve_metadata_enabled()
      .then(|| {
        image_static.exif.as_deref().and_then(|exif| {
          crate::exif::patched_payload(
            exif,
            image_static.width,
            image_static.height,
          )
        })
      })
      .flatten();
    let use_indexed_color = options.indexed;
    let is_animated = image_static.is_animated();
    let frame_count = image_static.frames.len();

    let data = if use_indexed_color.is_some_and(identity) {
      let png_quant_data = PNGQuantData::from_animated_image(&image_static, &options)?;
      PNGIndexesOrRGBAs::Indexes(png_quant_data)
    } else {
      let rgba_buffers: Vec<RgbImage> = image_static
        .frames
        .iter()
        .map(|frame| {
          let image = &frame.image;

          RgbImage::from(image)
        })
        .collect();
      PNGIndexesOrRGBAs::Rgba(rgba_buffers)
    };

    let mut png_writer = Vec::new();
    let mut png_info = png::Info::with_size(image_static.width, image_static.height);
    png_info.exif_metadata = exif.map(Cow::Owned);
    let mut png_encoder = png::Encoder::with_info(&mut png_writer, png_info)?;

    match data {
      PNGIndexesOrRGBAs::Rgba(ref rgba_buffers) => {
        log::debug!("use rgba encoder");
        let has_alpha = rgba_buffers
          .first()
          .map(|item| item.has_alpha())
          .unwrap_or(false);

        png_encoder.set_color(if has_alpha {
          png::ColorType::Rgba
        } else {
          png::ColorType::Rgb
        });
      }

      PNGIndexesOrRGBAs::Indexes(ref png_quant_data) => {
        log::debug!("use indexes encoder");
        let palette = &png_quant_data.palette;
        png_encoder.set_color(png::ColorType::Indexed);
        png_encoder.set_depth(palette.bit_depth);
        png_encoder.set_palette(&palette.palette);
        png_encoder.set_trns(&palette.trns);
      }
    }

    png_encoder.set_compression(png::Compression::High);
    png_encoder.set_filter(png::Filter::Paeth);

    if is_animated {
      png_encoder.set_animated(
        frame_count as u32,
        image_static.loop_count,
      )?;
    }

    let mut writer = png_encoder.write_header()?;

    for index in 0..frame_count {
      let frame = &image_static.frames[index];

      if is_animated {
        let (numer, denom) = frame.delay.ratio_seconds().safe_cast_u16().into();
        writer.set_frame_delay(numer, denom)?;
      }

      let mut frame_final_buffer;
      let mut frame_rect = Rect {
        x: 0,
        y: 0,
        width: image_static.width,
        height: image_static.height,
      };

      match data {
        PNGIndexesOrRGBAs::Rgba(ref rgb_buffers) => {
          frame_final_buffer = Cow::Borrowed(rgb_buffers[index].as_raw());

          if index > 0 {
            let rgb_image = &rgb_buffers[index - 1];
            let prev_data = rgb_image.as_raw();
            frame_rect = find_changed_rect_chunked(
              prev_data,
              &frame_final_buffer,
              image_static.width,
              image_static.height,
              rgb_image.bytes_per_pixel(),
            );

            if !frame_rect.equal_size(image_static.width, image_static.height) {
              frame_final_buffer = Cow::Owned(crop_bitmap_chunked(
                &frame_final_buffer,
                image_static.width,
                image_static.height,
                rgb_image.bytes_per_pixel(),
                &frame_rect,
              ));
            }
          }
        }

        PNGIndexesOrRGBAs::Indexes(ref quant_data) => {
          let mut crop_data = Cow::Borrowed(&quant_data.data[index]);

          if index > 0 {
            let prev_data = &quant_data.data[index - 1];
            frame_rect = find_changed_rect(
              prev_data,
              &crop_data,
              image_static.width,
              image_static.height,
            );

            if !frame_rect.equal_size(image_static.width, image_static.height) {
              crop_data = Cow::Owned(crop_bitmap(
                &crop_data,
                image_static.width,
                image_static.height,
                &frame_rect,
              ));
            }
          }

          frame_final_buffer = Cow::Owned(encode_indexes(
            frame_rect.width,
            frame_rect.height,
            &crop_data,
            quant_data.palette.bit_depth,
          ));
        }
      }

      if is_animated {
        writer.reset_frame_position()?;
        writer.set_frame_dimension(frame_rect.width, frame_rect.height)?;
        writer.set_frame_position(frame_rect.x, frame_rect.y)?;
      }

      writer.write_image_data(&frame_final_buffer)?;
    }

    drop(writer);

    log::debug!("PNG encoded, start oxipng...");

    if options.fastest == Some(true) {
      return Ok(png_writer);
    }

    let result = oxipng::optimize_from_memory(
      &png_writer,
      &oxipng::Options::from_preset(6), // TODO MAX
    )?;

    Ok(result)
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::PNGEncoder;

  fn minify_work(input_path: &str, output_path: &str, indexed: bool, quality: u8) {
    let buffer = read_samples_file_buffer(input_path);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let encoder = PNGEncoder;
    let optimized_buffer = encoder
      .encode(
        image,
        OptimizeOptions {
          indexed: Some(indexed),
          quality,
          ..Default::default()
        },
      )
      .unwrap();
    write_samples_file_buffer(output_path, &optimized_buffer);
  }

  #[test]
  fn it_minify_png_indexed() {
    minify_work(
      "png/dice-transparent.png",
      "png/output/dice-transparent-8bit.png",
      true,
      10,
    );
    minify_work(
      "png/leaves.png",
      "png/output/leaves-8bit.png",
      true,
      10,
    );
  }

  #[test]
  fn it_minify_png_rgba() {
    minify_work(
      "png/dice-transparent.png",
      "png/output/dice-transparent-rgba.png",
      false,
      0,
    );
    minify_work(
      "png/leaves.png",
      "png/output/leaves-rgba.png",
      false,
      0,
    );
  }

  #[test]
  fn it_minify_apng_indexed() {
    minify_work(
      "apng/clock-8bit.png",
      "apng/output/clock-8bit.png",
      true,
      80,
    );

    minify_work(
      "apng/o-24bit.png",
      "apng/output/o-8bit.png",
      true,
      80,
    );
  }

  #[test]
  fn it_minify_apng_rgba() {
    minify_work(
      "apng/clock-8bit.png",
      "apng/output/clock-rgba.png",
      false,
      0,
    );

    minify_work(
      "apng/o-24bit.png",
      "apng/output/o-rgba.png",
      false,
      0,
    );
  }
}
