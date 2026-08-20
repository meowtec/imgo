use std::slice;

use libavif_sys::*;
use minifier_utils::DelayExt;

// 3600 is multiple of most common fps
const ENCODER_TIMESCALE: u64 = 3600;
#[cfg(not(target_os = "emscripten"))]
const MAX_ENCODER_THREADS: usize = 4;

use crate::{errors::AvifError, exif, img::RgbImage, ImageEgg, ImageEncoder, OptimizeOptions};

fn encoder_thread_count() -> i32 {
  #[cfg(target_os = "emscripten")]
  {
    1
  }

  #[cfg(not(target_os = "emscripten"))]
  {
    std::thread::available_parallelism()
      .map(|count| count.get().min(MAX_ENCODER_THREADS) as i32)
      .unwrap_or(1)
  }
}

pub struct AvifEncoderInner<'a> {
  image: ImageEgg<'a>,
  encoder: *mut avifEncoder,
  lossless: bool,
  preserve_metadata: bool,
}

impl Drop for AvifEncoderInner<'_> {
  fn drop(&mut self) {
    unsafe {
      avifEncoderDestroy(self.encoder);
    }
  }
}

impl<'a> AvifEncoderInner<'a> {
  fn new(image: ImageEgg<'a>, options: OptimizeOptions) -> Self {
    let lossless = options.lossless_enabled();
    let encoder = unsafe {
      let encoder = avifEncoderCreate();
      (*encoder).timescale = ENCODER_TIMESCALE;
      (*encoder).maxThreads = encoder_thread_count();
      (*encoder).quality = options.quality as i32;
      (*encoder).qualityAlpha = options.quality as i32;
      if lossless {
        (*encoder).minQuantizer = AVIF_QUANTIZER_LOSSLESS as i32;
        (*encoder).maxQuantizer = AVIF_QUANTIZER_LOSSLESS as i32;
        (*encoder).minQuantizerAlpha = AVIF_QUANTIZER_LOSSLESS as i32;
        (*encoder).maxQuantizerAlpha = AVIF_QUANTIZER_LOSSLESS as i32;
      }
      (*encoder).repetitionCount = image.loop_count as i32 - 1;
      (*encoder).speed = options.speed.unwrap_or(6) as i32;
      encoder
    };

    AvifEncoderInner {
      image,
      encoder,
      lossless,
      preserve_metadata: options.preserve_metadata_enabled(),
    }
  }

  fn encode(mut self) -> anyhow::Result<Vec<u8>> {
    let encoder = self.encoder;
    let exif = self
      .preserve_metadata
      .then(|| {
        self.image.exif.as_deref().and_then(|exif| {
          exif::patched_payload(
            exif,
            self.image.width,
            self.image.height,
          )
        })
      })
      .flatten();
    let mut is_first_frame = true;

    for frame in self.image.frames_iter.as_mut() {
      let frame = frame?;
      let rgb_image = RgbImage::from(&frame.image);

      let avif_image = unsafe {
        avifImageCreate(
          frame.image.width(),
          frame.image.height(),
          8,
          if self.lossless {
            AVIF_PIXEL_FORMAT_YUV444
          } else {
            AVIF_PIXEL_FORMAT_YUV420
          },
        )
      };
      let mut avif_rgb = avifRGBImage::default();

      if self.lossless {
        unsafe {
          (*avif_image).yuvRange = AVIF_RANGE_FULL;
          (*avif_image).matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_IDENTITY as _;
        }
      }

      unsafe { avifRGBImageSetDefaults(&mut avif_rgb, avif_image) };

      avif_rgb.format = if rgb_image.has_alpha() {
        AVIF_RGB_FORMAT_RGBA
      } else {
        AVIF_RGB_FORMAT_RGB
      };
      avif_rgb.depth = 8;
      avif_rgb.pixels = rgb_image.as_raw().as_ptr() as *mut u8;

      let pixel_size = unsafe { avifRGBImagePixelSize(&avif_rgb) };

      avif_rgb.rowBytes = pixel_size * frame.image.width();

      let result = unsafe { avifImageAllocatePlanes(avif_image, AVIF_PLANES_YUV) };
      AvifError::assert(result)?;

      let result = unsafe { avifImageRGBToYUV(avif_image, &avif_rgb) };
      AvifError::assert(result)?;

      if is_first_frame {
        if let Some(exif) = &exif {
          let result = unsafe { avifImageSetMetadataExif(avif_image, exif.as_ptr(), exif.len()) };
          AvifError::assert(result)?;
        }
      }

      let result = unsafe {
        avifEncoderAddImage(
          encoder,
          avif_image,
          frame.delay.to_u64_base(ENCODER_TIMESCALE),
          AVIF_ADD_IMAGE_FLAG_NONE,
        )
      };
      AvifError::assert(result)?;

      unsafe { avifImageDestroy(avif_image) };
      is_first_frame = false;
    }

    let mut output = avifRWData::default();

    let result = unsafe { avifEncoderFinish(encoder, &mut output) };
    AvifError::assert(result)?;

    let result_buffer = unsafe { slice::from_raw_parts(output.data, output.size).to_vec() };

    unsafe {
      avifRWDataFree(&mut output);
    }

    Ok(result_buffer)
  }
}

#[derive(Debug)]
pub struct AvifEncoder;

impl ImageEncoder for AvifEncoder {
  fn encode(&self, image: ImageEgg<'_>, options: OptimizeOptions) -> anyhow::Result<Vec<u8>> {
    let encoder = AvifEncoderInner::new(image, options);
    encoder.encode()
  }
}

#[cfg(test)]
mod tests {
  use crate::{
    png::PNGDecoder,
    test_utils::test_utils::{read_samples_file_buffer, write_samples_file_buffer},
    ImageDecoder, ImageEncoder, OptimizeOptions,
  };

  use super::AvifEncoder;

  fn png_to_avif(input: &str, output: &str) {
    let buffer = read_samples_file_buffer(input);
    let decoder = PNGDecoder;
    let image = decoder.decode(&buffer).unwrap();

    let avif_encoder = AvifEncoder;
    let avif_buffer = avif_encoder
      .encode(image, OptimizeOptions::default())
      .unwrap();
    write_samples_file_buffer(output, &avif_buffer);
  }

  #[test]
  fn test_encode_avif() {
    png_to_avif(
      "png/dice-transparent.png",
      "png/output/dice-transparent.avif",
    );
    png_to_avif(
      "png/leaves.png",
      "png/output/leaves.avif",
    );
  }

  #[test]
  fn test_encode_avif_animated() {
    png_to_avif(
      "apng/clock-8bit.png",
      "apng/output/clock.avif",
    );
    png_to_avif("apng/o-24bit.png", "apng/output/o.avif");
    png_to_avif(
      "apng/stripe.png",
      "apng/output/stripe.avif",
    );
  }
}
