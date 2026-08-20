use std::borrow::Cow;

use anyhow::anyhow;
use image::{imageops, Delay, DynamicImage};
pub use minifier_utils::{
  types::{ImageResolution, OptimizeOptions, ResizeOptions},
  DelayExt, Size,
};

#[derive(Debug)]
pub struct ImageFrame {
  pub delay: Delay,
  pub image: DynamicImage,
}

impl ImageFrame {
  pub fn from_rgba_raw(
    buffer: Vec<u8>,
    width: u32,
    height: u32,
    delay: Delay,
  ) -> anyhow::Result<Self> {
    let len = buffer.len();

    let image = image::RgbaImage::from_raw(width, height, buffer)
      .map(image::DynamicImage::ImageRgba8)
      .ok_or(anyhow!(
        "Can not convert buffer ({} bytes) to RgbaImage ({}x{})",
        len,
        width,
        height
      ))?;

    Ok(Self { delay, image })
  }
}

pub trait Image {
  fn is_animated(&self) -> bool;
}

pub struct ImageEgg<'a> {
  pub is_animated: bool,
  pub frames_iter: Box<dyn Iterator<Item = anyhow::Result<ImageFrame>> + 'a>,
  pub width: u32,
  pub height: u32,
  pub loop_count: u32,
  pub exif: Option<Vec<u8>>,
}

pub struct ImageStatic {
  pub frames: Vec<ImageFrame>,
  pub width: u32,
  pub height: u32,
  pub loop_count: u32,
  pub exif: Option<Vec<u8>>,
}

pub struct SingleImage {
  pub image: DynamicImage,
  pub width: u32,
  pub height: u32,
  pub exif: Option<Vec<u8>>,
}

impl TryFrom<ImageEgg<'_>> for ImageStatic {
  type Error = anyhow::Error;

  fn try_from(value: ImageEgg) -> Result<Self, Self::Error> {
    Ok(ImageStatic {
      frames: value
        .frames_iter
        .collect::<anyhow::Result<Vec<ImageFrame>>>()?,
      width: value.width,
      height: value.height,
      loop_count: value.loop_count,
      exif: value.exif,
    })
  }
}

impl From<ImageStatic> for ImageEgg<'_> {
  fn from(value: ImageStatic) -> Self {
    ImageEgg {
      is_animated: value.frames.len() > 1,
      frames_iter: Box::new(value.frames.into_iter().map(Ok)),
      width: value.width,
      height: value.height,
      loop_count: value.loop_count,
      exif: value.exif,
    }
  }
}

impl From<DynamicImage> for ImageFrame {
  fn from(image: DynamicImage) -> Self {
    Self {
      delay: Delay::zero(),
      image,
    }
  }
}

impl From<ImageFrame> for ImageEgg<'_> {
  fn from(frame: ImageFrame) -> Self {
    ImageEgg {
      is_animated: false,
      width: frame.image.width(),
      height: frame.image.height(),
      loop_count: 0,
      frames_iter: Box::new(std::iter::once(Ok(frame))),
      exif: None,
    }
  }
}

impl From<DynamicImage> for ImageEgg<'_> {
  fn from(image: DynamicImage) -> Self {
    ImageFrame::from(image).into()
  }
}

impl ImageEgg<'_> {
  pub fn into_single(mut self) -> anyhow::Result<SingleImage> {
    let width = self.width;
    let height = self.height;
    let exif = self.exif;
    let image = self
      .frames_iter
      .next()
      .unwrap_or(Err(anyhow::anyhow!(
        "no image frame decoded"
      )))
      .map(|frame| frame.image)?;

    Ok(SingleImage {
      image,
      width,
      height,
      exif,
    })
  }

  pub fn into_single_image(mut self) -> anyhow::Result<DynamicImage> {
    self
      .frames_iter
      .next()
      .unwrap_or(Err(anyhow::anyhow!(
        "no image frame decoded"
      )))
      .map(|frame| frame.image)
  }

  pub fn downsize(self, size: &ResizeOptions, fast: bool) -> Self {
    let orig_size = Size::new(self.width, self.height);
    let new_size = Size::new(self.width, self.height).resize(
      Size::new(size.width, size.height),
      size.r#type,
    );

    if new_size == orig_size {
      return self;
    }

    let new_width = new_size.width;
    let new_height = new_size.height;

    ImageEgg {
      is_animated: self.is_animated,
      loop_count: self.loop_count,
      frames_iter: Box::new(
        self.frames_iter.map(move |frame_result| {
          let frame = frame_result?;
          Ok(ImageFrame {
            delay: frame.delay,
            image: frame.image.resize_exact(
              new_width,
              new_height,
              if fast {
                imageops::FilterType::Nearest
              } else {
                imageops::FilterType::Lanczos3
              },
            ),
          })
        }),
      ),
      width: new_width,
      height: new_height,
      exif: self.exif,
    }
  }
}

impl Image for ImageEgg<'_> {
  fn is_animated(&self) -> bool {
    self.is_animated
  }
}

impl Image for ImageStatic {
  fn is_animated(&self) -> bool {
    self.frames.len() > 1
  }
}

pub trait ImageDecoder: core::fmt::Debug {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<ImageEgg<'a>>;
}

pub trait ImageEncoder: core::fmt::Debug {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>>;
}

pub enum RgbImage<'a> {
  Rgb8(Cow<'a, image::RgbImage>),
  Rgba8(Cow<'a, image::RgbaImage>),
}

impl RgbImage<'_> {
  pub fn as_raw(&self) -> &[u8] {
    match self {
      Self::Rgb8(image) => image.as_raw(),
      Self::Rgba8(image) => image.as_raw(),
    }
  }

  pub fn bytes_per_pixel(&self) -> u8 {
    match self {
      Self::Rgb8(_) => 3,
      Self::Rgba8(_) => 4,
    }
  }

  pub fn has_alpha(&self) -> bool {
    match self {
      Self::Rgb8(_) => false,
      Self::Rgba8(_) => true,
    }
  }
}

impl<'a> From<&'a DynamicImage> for RgbImage<'a> {
  fn from(image: &'a DynamicImage) -> Self {
    match image {
      DynamicImage::ImageRgb8(image) => Self::Rgb8(Cow::Borrowed(image)),
      DynamicImage::ImageRgba8(image) => Self::Rgba8(Cow::Borrowed(image)),
      DynamicImage::ImageRgba16(_)
      | DynamicImage::ImageRgba32F(_)
      | DynamicImage::ImageLumaA8(_)
      | DynamicImage::ImageLumaA16(_) => Self::Rgba8(Cow::Owned(image.to_rgba8())),
      _ => Self::Rgb8(Cow::Owned(image.to_rgb8())),
    }
  }
}

#[cfg(test)]
mod tests {
  use image::{DynamicImage, RgbaImage};

  use super::{ImageEgg, ImageFrame, ImageStatic};

  #[test]
  fn image_static_preserves_exif() {
    let frame = ImageFrame {
      delay: image::Delay::from_numer_denom_ms(0, 1),
      image: DynamicImage::ImageRgba8(RgbaImage::new(1, 1)),
    };
    let image = ImageEgg {
      is_animated: false,
      frames_iter: Box::new(std::iter::once(Ok(frame))),
      width: 1,
      height: 1,
      loop_count: 0,
      exif: Some(vec![1, 2, 3]),
    };

    let image_static = ImageStatic::try_from(image).unwrap();
    assert_eq!(image_static.exif, Some(vec![1, 2, 3]));

    let image = ImageEgg::from(image_static);
    assert_eq!(image.exif, Some(vec![1, 2, 3]));
  }
}
