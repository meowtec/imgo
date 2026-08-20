use core::slice;
use std::marker::PhantomData;

use image::Delay;
use libavif_sys::*;
use minifier_utils::DelayExt;

use crate::{errors::AvifError, exif, ImageDecoder, ImageEgg, ImageFrame};

pub struct AvifDecoderInner<'a> {
  decoder: *mut avifDecoder,
  phantom: PhantomData<&'a ()>,
}

struct AvifFrameIterator<'a> {
  decoder: AvifDecoderInner<'a>,
}

impl<'a> From<AvifDecoderInner<'a>> for AvifFrameIterator<'a> {
  fn from(decoder: AvifDecoderInner<'a>) -> Self {
    AvifFrameIterator { decoder }
  }
}

impl Iterator for AvifFrameIterator<'_> {
  type Item = anyhow::Result<ImageFrame>;

  fn next(&mut self) -> Option<Self::Item> {
    self.decoder.next_frame()
  }
}

impl Drop for AvifDecoderInner<'_> {
  fn drop(&mut self) {
    unsafe {
      avifDecoderDestroy(self.decoder);
    }
  }
}

impl<'a> AvifDecoderInner<'a> {
  pub fn new(buffer: &'a [u8]) -> anyhow::Result<Self> {
    let decoder = unsafe {
      let decoder = avifDecoderCreate();
      let result = avifDecoderSetIOMemory(decoder, buffer.as_ptr(), buffer.len());

      AvifError::assert(result)?;

      decoder
    };

    Ok(AvifDecoderInner {
      decoder,
      phantom: PhantomData,
    })
  }

  pub fn decode(self) -> anyhow::Result<ImageEgg<'a>> {
    let decoder = self.decoder;

    let result = unsafe { avifDecoderParse(decoder) };

    AvifError::assert(result)?;

    let frame_count = unsafe { (*decoder).imageCount as usize };
    let loop_count = unsafe { (*decoder).repetitionCount + 1 };
    let image = unsafe { *(*decoder).image };
    let exif = unsafe {
      if image.exif.size == 0 {
        None
      } else {
        exif::normalize_payload(slice::from_raw_parts(
          image.exif.data,
          image.exif.size,
        ))
      }
    };

    let frame_iter: AvifFrameIterator = self.into();

    Ok(ImageEgg {
      is_animated: frame_count > 1,
      loop_count: loop_count.try_into().unwrap_or(0),
      frames_iter: Box::new(frame_iter),
      width: image.width,
      height: image.height,
      exif,
    })
  }

  pub fn next_frame(&mut self) -> Option<anyhow::Result<ImageFrame>> {
    let decoder = self.decoder;

    let result = unsafe { avifDecoderNextImage(decoder) };

    if result == AVIF_RESULT_NO_IMAGES_REMAINING {
      return None;
    }

    if result != AVIF_RESULT_OK {
      return Some(Err(AvifError::new(result).into()));
    }

    let image = unsafe { (*decoder).image };

    // convert image to rgba
    let mut rgb = avifRGBImage::default();

    unsafe {
      avifRGBImageSetDefaults(&mut rgb, image);
    }

    // use rgba8
    rgb.depth = 8;

    let pixel_size = unsafe { avifRGBImagePixelSize(&rgb) };
    let rgba_buffer: Vec<u8> = vec![0; (pixel_size * rgb.width * rgb.height) as usize];
    rgb.pixels = rgba_buffer.as_ptr() as *mut u8;
    rgb.rowBytes = pixel_size * rgb.width;

    let convert_result = unsafe { avifImageYUVToRGB(image, &mut rgb) };

    if let Err(err) = AvifError::assert(convert_result) {
      return Some(Err(err.into()));
    }

    let (timescale, duration_in_timescales) = unsafe {
      let ts = (*decoder).imageTiming.timescale;
      let dur = (*decoder).imageTiming.durationInTimescales;
      (ts, dur)
    };

    let delay = Delay::from_numer_denom_u64(duration_in_timescales, timescale);

    let frame = ImageFrame::from_rgba_raw(
      rgba_buffer,
      rgb.width,
      rgb.height,
      delay,
    );

    Some(frame)
  }
}

#[derive(Debug)]
pub struct AvifDecoder;

impl ImageDecoder for AvifDecoder {
  fn decode<'a>(&self, buffer: &'a [u8]) -> anyhow::Result<ImageEgg<'a>> {
    let decoder = AvifDecoderInner::new(buffer)?;
    decoder.decode()
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGEncoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  fn avif_to_png(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = super::AvifDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let png_encoder = PNGEncoder;

    let png_buffer = png_encoder
      .encode(image, OptimizeOptions::default())
      .unwrap();
    write_samples_file_buffer(output, &png_buffer);
  }

  #[test]
  fn test_decode_avif() {
    avif_to_png("avif/o.avif", "avif/output/o.png");
    avif_to_png(
      "avif/clock.avif",
      "avif/output/clock.png",
    );
    avif_to_png("avif/fox.avif", "avif/output/fox.png");
  }
}
