use std::{
  collections::HashMap,
  path::PathBuf,
  sync::{Arc, Mutex},
};

use minifier::{ImageFormat, ImageResolution};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FileObject {
  pub(crate) id: String,
  pub(crate) size: u64,
  pub(crate) name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ImageObject {
  /// 文件
  pub(crate) file: FileObject,
  /// 格式
  pub(crate) format: ImageFormat,
  /// 分辨率
  pub(crate) resolution: Option<ImageResolution>,
}

impl ImageObject {
  pub fn source_file_path(&self) -> PathBuf {
    PathBuf::from(&self.file.name)
  }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ImageOptimizeResult {
  pub(crate) input_resolution: ImageResolution,
  pub(crate) image: ImageObject,
}
