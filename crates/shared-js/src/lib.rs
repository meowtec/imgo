mod utils;

use imgo_shared::types::{ImageFormat, ResizeType, Size};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
  fn alert(s: &str);
}

#[wasm_bindgen]
pub fn resize(base_size: Size, target_size: Size, resize_type: ResizeType) -> Size {
  base_size.resize(target_size, resize_type)
}

#[wasm_bindgen(js_name = getExtension)]
pub fn get_extension(format: ImageFormat) -> String {
  format.extensions_str().to_string()
}
