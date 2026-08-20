use libavif_sys::*;
use std::fmt::Display;

#[derive(Debug, Clone)]
pub struct AvifError {
  code: u32,
  message: String,
}

impl AvifError {
  pub fn new(result_code: u32) -> Self {
    let message = unsafe {
      let message_ptr = avifResultToString(result_code);
      std::ffi::CStr::from_ptr(message_ptr)
        .to_string_lossy()
        .into_owned()
    };
    AvifError {
      code: result_code,
      message,
    }
  }

  pub fn assert(result_code: u32) -> Result<(), AvifError> {
    if result_code == AVIF_RESULT_OK {
      Ok(())
    } else {
      Err(AvifError::new(result_code))
    }
  }
}

impl Display for AvifError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}: {}", self.code, self.message)
  }
}

impl std::error::Error for AvifError {}
