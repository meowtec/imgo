pub use minifier_utils::types::ImageFormat;

pub fn detect_format_from_buffer(buffer: &[u8]) -> Option<ImageFormat> {
  let source_type_guess = image::guess_format(buffer)
    .ok()
    .and_then(|image_type| ImageFormat::try_from(image_type).ok());

  source_type_guess.or_else(|| {
    #[cfg(feature = "jxl")]
    {
      if jpegxl_rs::utils::check_valid_signature(buffer) == Some(true) {
        return Some(ImageFormat::Jxl);
      }
    }

    if buffer[4..12] == [102, 116, 121, 112, 97, 118, 105, 115]
      || buffer[4..12] == [102, 116, 121, 112, 97, 118, 105, 102]
    {
      return Some(ImageFormat::Avif);
    }

    #[cfg(feature = "heif")]
    {
      let guess_heif_result = libheif_rs::check_file_type(buffer);

      if buffer.len() >= 8
        && (guess_heif_result == libheif_rs::FileTypeResult::Supported
          || guess_heif_result == libheif_rs::FileTypeResult::MayBe)
      {
        return Some(ImageFormat::Heic);
      }
    }

    None
  })
}
