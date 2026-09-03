mod utils;

use imgo_shared::types::{ImageFormat, ResizeType, Size};
use tsify::{Ts, Tsify};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
  fn alert(s: &str);
}

#[wasm_bindgen]
pub fn resize(
  base_size: Ts<Size>,
  target_size: Ts<Size>,
  resize_type: Ts<ResizeType>,
) -> Result<Ts<Size>, JsError> {
  Ok(
    base_size
      .to_rust()?
      .resize(target_size.to_rust()?, resize_type.to_rust()?)
      .into_ts()?,
  )
}

#[wasm_bindgen(js_name = getExtension)]
pub fn get_extension(format: Ts<ImageFormat>) -> Result<String, JsError> {
  Ok(format.to_rust()?.extensions_str().to_string())
}
