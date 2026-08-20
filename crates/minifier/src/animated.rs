use anyhow::anyhow;
use image::{AnimationDecoder, Delay, DynamicImage, ImageDecoder};
use minifier_utils::DelayExt;

use crate::{ImageEgg, ImageFrame};

pub fn image_animated_decoder_to_img<'a, T: ImageDecoder, U: AnimationDecoder<'a>>(
  decoder: T,
  has_animation: bool,
  into_animated_decoder: impl FnOnce(T) -> anyhow::Result<U>,
) -> anyhow::Result<crate::ImageEgg<'a>> {
  let (width, height) = decoder.dimensions();

  let frames: Box<dyn Iterator<Item = anyhow::Result<ImageFrame>>> = if has_animation {
    let animated_decoder = into_animated_decoder(decoder)?;
    let raw_frames = animated_decoder.into_frames();

    Box::new(raw_frames.map(move |frame| {
      let frame = frame?;
      let left = frame.left();
      let top = frame.top();
      let delay = frame.delay();
      let buffer = frame.into_buffer();

      if left != 0 || top != 0 || buffer.width() != width || buffer.height() != height {
        return Err(anyhow!(
          "WebP frame with non-zero offset is not supported",
        ));
      }

      Ok(ImageFrame {
        delay,
        image: image::DynamicImage::ImageRgba8(buffer),
      })
    }))
  } else {
    let image = DynamicImage::from_decoder(decoder)?;
    Box::new(
      [Ok(ImageFrame {
        delay: Delay::zero(),
        image,
      })]
      .into_iter(),
    )
  };

  Ok(ImageEgg {
    is_animated: has_animation,
    frames_iter: frames,
    width,
    height,
    loop_count: 0,
    exif: None,
  })
}
