use std::{fs, path::PathBuf};

use crate::app_options::AppOptions;

/// Persisted application options.
///
/// The schema is defined in Rust (`app_options::AppOptions`) and TS bindings are
/// generated with ts-rs. This is the single on-disk source of truth on desktop.
/// `None` means "nothing persisted yet", in which case the frontend falls back
/// to its own defaults.
pub struct AppConfig {
  path: PathBuf,
  options: Option<AppOptions>,
}

impl Default for AppConfig {
  fn default() -> Self {
    Self {
      path: PathBuf::new(),
      options: None,
    }
  }
}

impl AppConfig {
  pub fn load(path: PathBuf) -> Self {
    let options = fs::read_to_string(&path)
      .ok()
      .and_then(|content| serde_json::from_str(&content).ok());

    Self { path, options }
  }

  pub fn options(&self) -> Option<&AppOptions> {
    self.options.as_ref()
  }

  pub fn set_options(&mut self, options: AppOptions) -> std::io::Result<()> {
    if let Some(parent) = self.path.parent() {
      fs::create_dir_all(parent)?;
    }

    let content = serde_json::to_string_pretty(&options).unwrap_or_else(|_| "{}".to_string());

    // Write to a temporary file first so a crash mid-write cannot corrupt the config.
    let tmp_path = self.path.with_extension("json.tmp");
    fs::write(&tmp_path, content)?;
    fs::rename(&tmp_path, &self.path)?;

    self.options = Some(options);

    Ok(())
  }

  /// Whether the user wants a confirmation dialog when closing with a non-empty queue.
  /// Defaults to `true` when nothing has been persisted yet.
  pub fn confirm_on_close(&self) -> bool {
    self
      .options
      .as_ref()
      .map(|options| options.confirm_on_close)
      .unwrap_or(true)
  }
}
