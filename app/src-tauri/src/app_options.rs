use minifier::{ImageFormat, OptimizeOptions};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

fn default_skip_save_min_ratio() -> f64 {
  1.0
}

fn default_true() -> bool {
  true
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export)]
pub enum AppTheme {
  #[default]
  Light,
  Dark,
  System,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[ts(export)]
pub enum SkipSaveType {
  #[default]
  None,
  SameFormat,
  All,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct GlobalDefaultOptions {
  /// Concrete input formats this profile applies to.
  /// An empty list means "all formats".
  pub input_formats: Vec<ImageFormat>,
  /// Output format, or `None` to keep the input format.
  pub output_format: Option<ImageFormat>,
  /// The nested optimize options are owned by the shared crate and already
  /// exposed to the frontend as `OptimizeOptions` from `@imgo/shared-js`.
  #[ts(type = "import(\"@imgo/shared-js\").OptimizeOptions")]
  pub options: OptimizeOptions,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct AppOptions {
  #[serde(default)]
  pub skip_save_type: SkipSaveType,
  #[serde(default = "default_skip_save_min_ratio")]
  pub skip_save_min_ratio: f64,
  #[serde(default)]
  pub new_file_name_suffix: String,
  #[serde(default)]
  pub global_default_options: Vec<GlobalDefaultOptions>,
  #[serde(default)]
  pub app_theme: AppTheme,
  #[serde(default = "default_true")]
  pub confirm_on_close: bool,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn input_formats_round_trip() {
    let formats: Vec<ImageFormat> = serde_json::from_str(r#"["PNG"]"#).unwrap();
    assert_eq!(formats, vec![ImageFormat::Png]);
    assert_eq!(
      serde_json::to_string(&formats).unwrap(),
      r#"["PNG"]"#
    );

    let all: Vec<ImageFormat> = serde_json::from_str(r#"[]"#).unwrap();
    assert!(all.is_empty());
  }

  #[test]
  fn output_format_round_trip() {
    let same: Option<ImageFormat> = serde_json::from_str("null").unwrap();
    assert_eq!(same, None);

    let format: Option<ImageFormat> = serde_json::from_str(r#""WEBP""#).unwrap();
    assert_eq!(format, Some(ImageFormat::WebP));
  }

  #[test]
  fn partial_options_use_field_defaults() {
    let options: AppOptions = serde_json::from_str(r#"{"confirmOnClose": false}"#).unwrap();
    assert!(!options.confirm_on_close);
    assert_eq!(
      options.skip_save_type,
      SkipSaveType::None
    );
    assert_eq!(options.skip_save_min_ratio, 1.0);
    assert_eq!(options.app_theme, AppTheme::Light);
    assert!(options.global_default_options.is_empty());
  }
}
