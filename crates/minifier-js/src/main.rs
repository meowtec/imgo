use std::path;

use minifier::{detect_format_from_buffer, ImageFormat, ImageResolution, OptimizeOptions};
use minifier_js::Buff;
use serde::Serialize;

fn main() {}

#[no_mangle]
pub fn alloc_buff(size: usize) -> *mut Buff {
  Box::into_raw(Box::new(Buff::new_with_size(size)))
}

#[no_mangle]
pub unsafe fn free_buff(ptr: *mut Buff) {
  let _ = Buff::try_from_raw(ptr);
}

#[derive(Debug, Serialize)]
pub struct OptimizeSuccessResult {
  buffer_ptr: u32,
  input_resolution: ImageResolution,
  output_resolution: ImageResolution,
  output_format: ImageFormat,
}

#[derive(Debug, Serialize)]
pub struct OptimizeFailResult {
  code: u32,
  message: String,
}

#[no_mangle]
pub unsafe fn get_format_from_path(path_ptr: *mut Buff) -> *mut Buff {
  let path_string: String = Buff::try_from_raw(path_ptr)
    .expect("invalid path")
    .to_string();

  let format = path::Path::new(&path_string)
    .extension()
    .and_then(minifier::ImageFormat::detect_from_extension);

  Buff::from_data(&format).into_raw()
}

#[no_mangle]
pub unsafe fn get_format_from_buffer(buffer_ptr: *mut Buff) -> *mut Buff {
  let data = Buff::try_from_raw(buffer_ptr)
    .expect("invalid path")
    .into_vec();

  let format = detect_format_from_buffer(&data);

  Buff::from_data(&format).into_raw()
}

#[no_mangle]
pub unsafe fn optimize_image(
  buffer_ptr: *mut Buff,
  output_format: *mut Buff,
  options_ptr: *mut Buff,
) -> *mut Buff {
  let buffer = Buff::try_from_raw(buffer_ptr)
    .expect("image buffer from raw")
    .into_vec();
  let format: Option<minifier::ImageFormat> = Buff::try_from_raw(output_format)
    .expect("format from raw")
    .try_to_data()
    .unwrap();
  let options: Option<OptimizeOptions> = Buff::try_from_raw(options_ptr)
    .expect("options from raw")
    .try_to_data()
    .unwrap();

  let result = minifier::optimize_image(&buffer, format, options, None);

  let buff = match result {
    Ok(result) => {
      let buff = Buff::new(result.data);

      let result = OptimizeSuccessResult {
        buffer_ptr: Box::into_raw(Box::new(buff)) as u32,
        output_format: result.output_type,
        input_resolution: result.input_resolution,
        output_resolution: result.output_resolution,
      };

      Buff::from_data(&result)
    }
    Err(err) => {
      let result = OptimizeFailResult {
        code: 1,
        message: err.to_string(),
      };

      Buff::from_data(&result)
    }
  };

  buff.into_raw()
}
