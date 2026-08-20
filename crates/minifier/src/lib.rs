mod animated;
#[cfg(feature = "avif")]
mod avif;
mod errors;
mod exif;
mod format;
mod generic;
mod gif;
#[cfg(feature = "heif")]
mod heif;
mod img;
mod jpeg;
#[cfg(feature = "jxl")]
mod jxl;
mod png;
mod test_utils;
mod webp;

#[cfg(feature = "jxl")]
use std::io::Cursor;
use std::time;

use anyhow::anyhow;

pub use format::{detect_format_from_buffer, ImageFormat};
use img::{Image, ImageDecoder, ImageEgg, ImageEncoder, ImageFrame, ImageStatic};

pub use img::ImageResolution;
pub use img::OptimizeOptions;

fn decode_image(file_buffer: &[u8], image_format: ImageFormat) -> anyhow::Result<ImageEgg<'_>> {
  let decoder: Box<dyn ImageDecoder> = match image_format {
    #[cfg(feature = "avif")]
    ImageFormat::Avif => Box::new(avif::AvifDecoder),
    #[cfg(feature = "heif")]
    ImageFormat::Heic => Box::new(heif::HeifDecoder),
    ImageFormat::WebP => Box::new(webp::WebpDecoder),
    ImageFormat::Png => Box::new(png::PNGDecoder),
    ImageFormat::Gif => Box::new(gif::GifDecoder),
    #[cfg(feature = "jxl")]
    ImageFormat::Jxl => Box::new(jxl::JxlDecoder),
    _ => Box::new(generic::GenericDecoder),
  };
  decoder.decode(file_buffer)
}

fn encode_image(
  image: ImageEgg,
  image_format: ImageFormat,
  options: OptimizeOptions,
) -> anyhow::Result<Vec<u8>> {
  let options = options.normalized_for_format(image_format);
  let encoder: Box<dyn ImageEncoder> = match image_format {
    #[cfg(feature = "avif")]
    ImageFormat::Avif => Box::new(avif::AvifEncoder),
    #[cfg(feature = "heif")]
    ImageFormat::Heic => Box::new(heif::HeifEncoder),
    ImageFormat::WebP => Box::new(webp::WebpEncoder),
    ImageFormat::Png => Box::new(png::PNGEncoder),
    ImageFormat::Gif => Box::new(gif::GifEncoder),
    ImageFormat::Jpeg => Box::new(jpeg::JpegEncoder),
    #[cfg(feature = "jxl")]
    ImageFormat::Jxl => Box::new(jxl::JxlEncoder),
    _ => Box::new(generic::GenericEncoder::new(
      image_format,
    )),
  };

  encoder.encode(image, options)
}

pub struct OptimizeResult {
  pub data: Vec<u8>,
  pub output_type: ImageFormat,
  pub input_resolution: ImageResolution,
  pub output_resolution: ImageResolution,
}

pub fn optimize_image(
  file_buffer: &[u8],
  output_format: Option<ImageFormat>,
  options: Option<OptimizeOptions>,
  debug_id: Option<&str>,
) -> anyhow::Result<OptimizeResult> {
  let input_type =
    detect_format_from_buffer(file_buffer).ok_or_else(|| anyhow!("Unknown image format"))?;
  let output_type = output_format.unwrap_or(input_type);
  log::info!(
    "optimize {} from buffer of {} bytes to format {:?} with quality {}",
    debug_id.unwrap_or_default(),
    file_buffer.len(),
    &output_type,
    options.as_ref().map_or("NULL".to_string(), |x| x
      .quality
      .to_string()),
  );
  let options = options.unwrap_or_default();

  #[cfg(feature = "jxl")]
  if input_type == ImageFormat::Jpeg
    && output_type == ImageFormat::Jxl
    && options.lossless_enabled()
    && options.resize.is_none()
  {
    let (width, height) = image::ImageReader::new(Cursor::new(file_buffer))
      .with_guessed_format()?
      .into_dimensions()?;
    let encoded_data = jxl::JxlEncoder::encode_jpeg_losslessly(file_buffer)?;

    return Ok(OptimizeResult {
      data: encoded_data,
      output_type,
      input_resolution: ImageResolution { width, height },
      output_resolution: ImageResolution { width, height },
    });
  }

  let decode_start = time::Instant::now();
  let image = decode_image(file_buffer, input_type)?;
  log::info!(
    "decode finish: {}, {:?}",
    debug_id.unwrap_or_default(),
    decode_start.elapsed()
  );
  let input_resolution = ImageResolution {
    width: image.width,
    height: image.height,
  };

  let resized_image = match &options {
    OptimizeOptions {
      resize: Some(resize),
      fastest,
      ..
    } => {
      let resize_start = time::Instant::now();
      let fast_resize = fastest.unwrap_or(false);
      let resized = image.downsize(resize, fast_resize);
      log::info!(
        "resize (fast={}) finish: {}, {:?}",
        fast_resize,
        debug_id.unwrap_or_default(),
        resize_start.elapsed()
      );
      resized
    }
    _ => image,
  };

  let output_resolution = ImageResolution {
    width: resized_image.width,
    height: resized_image.height,
  };

  let encode_start = time::Instant::now();
  let encoded_data = encode_image(resized_image, output_type, options)?;
  log::info!(
    "encode finish: {}, {:?}",
    debug_id.unwrap_or_default(),
    encode_start.elapsed()
  );

  Ok(OptimizeResult {
    data: encoded_data,
    output_type,
    input_resolution,
    output_resolution,
  })
}

#[cfg(all(test, feature = "jxl"))]
mod tests {
  use jpegxl_rs::decode::Data;

  use super::{optimize_image, ImageFormat, OptimizeOptions};

  #[test]
  fn losslessly_transcodes_jpeg_to_jxl() {
    let jpeg = include_bytes!("../samples/jpeg/sample.jpg");
    let result = optimize_image(
      jpeg,
      Some(ImageFormat::Jxl),
      Some(OptimizeOptions {
        lossless: Some(true),
        ..Default::default()
      }),
      None,
    )
    .unwrap();

    let (_, Data::Jpeg(reconstructed)) = jpegxl_rs::decoder_builder()
      .build()
      .unwrap()
      .reconstruct(&result.data)
      .unwrap()
    else {
      panic!("JPEG reconstruction data is missing");
    };

    assert_eq!(jpeg, reconstructed.as_slice());
    assert_eq!(
      result.input_resolution.width,
      result.output_resolution.width
    );
    assert_eq!(
      result.input_resolution.height,
      result.output_resolution.height
    );
  }
}
