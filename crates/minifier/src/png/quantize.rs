use std::borrow::Cow;

use anyhow::Context;
use image::DynamicImage;
use imagequant::{Histogram, QuantizationResult};
use png::BitDepth;

use crate::{Image, ImageFrame, ImageStatic, OptimizeOptions};

pub struct EncodedPalette {
  pub bit_depth: BitDepth,
  pub palette: Vec<u8>,
  pub trns: Vec<u8>,
}

pub type PNGQuantIndexedData = Vec<Vec<u8>>;

pub struct PNGQuantData {
  pub palette: EncodedPalette,
  // index data for each frames
  pub data: PNGQuantIndexedData,
}

fn get_trns_len(colors: &[imagequant::RGBA]) -> usize {
  colors.len()
    - colors
      .iter()
      .rev()
      .position(|color| color.a < 255)
      .unwrap_or(colors.len())
}

fn get_colors_bit_depth(color_num: usize) -> BitDepth {
  if color_num <= 2 {
    BitDepth::One
  } else if color_num <= 4 {
    BitDepth::Two
  } else if color_num <= 16 {
    BitDepth::Four
  } else {
    BitDepth::Eight
  }
}

fn frame_to_rgba8(frame: &ImageFrame) -> Cow<'_, image::RgbaImage> {
  match &frame.image {
    DynamicImage::ImageRgba8(image) => Cow::Borrowed(image),
    r => Cow::Owned(r.to_rgba8()),
  }
}

impl EncodedPalette {
  fn from_colors(colors: &[imagequant::RGBA]) -> Self {
    let trns_len = get_trns_len(colors);
    let mut trns = Vec::with_capacity(trns_len);
    let mut palette = Vec::with_capacity(colors.len() * 3);

    // fill palette and trns
    for (index, color) in colors.iter().enumerate() {
      palette.push(color.r);
      palette.push(color.g);
      palette.push(color.b);

      if index < trns_len {
        trns.push(color.a);
      }
    }

    EncodedPalette {
      bit_depth: get_colors_bit_depth(colors.len()),
      palette,
      trns,
    }
  }
}

impl PNGQuantData {
  pub fn from_animated_image(
    image: &ImageStatic,
    options: &OptimizeOptions,
  ) -> anyhow::Result<Self> {
    use rgb::FromSlice;

    let is_animated = image.is_animated();
    let mut quant_attr = imagequant::new();
    let mut quant_images = image
      .frames
      .iter()
      .map(|frame| {
        imagequant::Image::new(
          &quant_attr,
          frame_to_rgba8(frame).as_rgba(),
          image.width as usize,
          image.height as usize,
          0.0,
        )
        .with_context(|| "Can not create imagequant::Image")
      })
      .collect::<Result<Vec<_>, _>>()?;

    let mut quant_result: QuantizationResult;
    let encoded_palette: EncodedPalette;
    let mut indexed_data: Vec<Vec<u8>> = vec![];

    quant_attr.set_quality(0, options.quality)?;

    if is_animated {
      let mut histogram = Histogram::new(&quant_attr);

      for image in &mut quant_images {
        histogram.add_image(&quant_attr, image)?;
      }

      quant_result = histogram.quantize(&quant_attr)?;
      encoded_palette = EncodedPalette::from_colors(quant_result.palette());

      for image in &mut quant_images {
        let remapped = quant_result.remapped(image)?;
        indexed_data.push(remapped.1);
      }
    } else {
      let quant_image = &mut quant_images[0];

      quant_result = quant_attr.quantize(quant_image)?;
      let remap_result = quant_result.remapped(quant_image)?;
      encoded_palette = EncodedPalette::from_colors(&remap_result.0);
      indexed_data.push(remap_result.1);
    }

    Ok(PNGQuantData {
      palette: encoded_palette,
      data: indexed_data,
    })
  }
}
