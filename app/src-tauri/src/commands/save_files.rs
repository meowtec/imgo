use anyhow::Context;
use log::debug;
use minifier::ImageFormat;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use ts_rs::TS;

use crate::{oss::read_file_data, structs::ImageObject};

#[derive(Clone, Copy, PartialEq, Eq, Debug, Deserialize, Serialize, TS)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[ts(export)]
pub enum SaveFilesTriggerType {
  SaveAs,
  AutoNewName,
  Override,
  SaveToDir,
}

fn reform_ext_if_needed<P: Into<PathBuf>>(path: P, format: ImageFormat) -> PathBuf {
  let mut path: PathBuf = path.into();
  let original_format = path
    .extension()
    .and_then(ImageFormat::detect_from_extension);
  if original_format == Some(format) {
    path
  } else {
    path.set_extension(format.extensions_str());
    path
  }
}

fn find_unoccupied_file_path<P: Into<PathBuf>>(path: P) -> PathBuf {
  let path: PathBuf = path.into();
  let ext = path.extension();
  let initial_file_stem = path
    .file_stem()
    .map(|f| f.to_string_lossy().into_owned())
    .unwrap_or("untitled".to_string());

  let mut mut_path = path.clone();

  for i in 1.. {
    if !mut_path.exists() {
      break;
    };

    mut_path.set_file_name(format!("{}({})", initial_file_stem, i));

    if let Some(ext) = ext {
      mut_path.set_extension(ext);
    }
  }

  mut_path
}

struct FinalSaveFile {
  image: ImageObject,
  save_path: PathBuf,
  r#override: bool,
}

fn final_save_files(files: Vec<FinalSaveFile>) -> Vec<String> {
  let success_ids = files
    .iter()
    .map(|file| {
      let final_path = if file.r#override {
        // 用户已确认替换（如系统保存对话框的 replace 确认），直接写用户选择的路径
        file.save_path.clone()
      } else {
        find_unoccupied_file_path(&file.save_path)
      };

      let data = read_file_data(&file.image.file.id).with_context(|| {
        format!(
          "read file data from id {} error",
          &file.image.file.id
        )
      })?;
      std::fs::write(&final_path, &data).with_context(|| {
        format!(
          "write file data to {} error",
          final_path.to_string_lossy()
        )
      })?;
      Ok(file.image.file.id.clone())
    })
    .filter_map(
      |result: anyhow::Result<String>| match result {
        Ok(id) => Some(id),
        Err(err) => {
          debug!("save file error: {}", err);
          None
        }
      },
    )
    .collect::<Vec<String>>();

  success_ids
}

pub fn blocking_save_files(
  app_handle: AppHandle,
  images: Vec<ImageObject>,
  save_type: SaveFilesTriggerType,
) -> Vec<String> {
  let dest_files: Vec<FinalSaveFile> = match save_type {
    SaveFilesTriggerType::SaveAs => {
      if images.len() != 1 {
        log::error!(
          "`save as` only support single image, but got {}",
          images.len()
        );
      }

      let image = images[0].clone();

      // 预填文件名（原文件名 + 正确的后缀）；OS 对话框会自动处理「文件已存在是否替换」的提示
      let suggested_name = reform_ext_if_needed(
        image.source_file_path(),
        image.format.into(),
      )
      .file_name()
      .map(|s| s.to_string_lossy().into_owned())
      .unwrap_or_else(|| "untitled".to_string());

      let file_path = app_handle
        .dialog()
        .file()
        .set_file_name(&suggested_name)
        .blocking_save_file();

      debug!("save as: {:?}", file_path);

      let file_path = match file_path.and_then(|fp| fp.into_path().ok()) {
        Some(path) => path,
        None => return vec![],
      };

      vec![FinalSaveFile {
        image,
        save_path: file_path.to_path_buf(),
        r#override: true,
      }]
    }

    SaveFilesTriggerType::AutoNewName | SaveFilesTriggerType::Override => images
      .iter()
      .map(|image| {
        let user_file_path = image.source_file_path();
        let final_path = reform_ext_if_needed(user_file_path, image.format.into());

        FinalSaveFile {
          image: image.clone(),
          save_path: final_path,
          r#override: save_type == SaveFilesTriggerType::Override,
        }
      })
      .collect(),

    SaveFilesTriggerType::SaveToDir => {
      let dir = app_handle.dialog().file().blocking_pick_folder();

      debug!("save to dir: {:?}", dir);

      let dir = match dir.and_then(|fp| fp.into_path().ok()) {
        Some(path) => path,
        None => return vec![],
      };

      images
        .iter()
        .map(|image| {
          let file_name = image
            .source_file_path()
            .file_name()
            .and_then(|osstr| osstr.to_str())
            .unwrap_or("untitled")
            .to_string();
          let target_file_path = reform_ext_if_needed(
            dir.join(&file_name),
            image.format.into(),
          );

          FinalSaveFile {
            image: image.clone(),
            save_path: target_file_path,
            r#override: false,
          }
        })
        .collect()
    }
  };

  final_save_files(dest_files)
}

#[cfg(test)]
mod tests {
  use minifier::ImageFormat;
  use std::path::PathBuf;

  use super::{find_unoccupied_file_path, reform_ext_if_needed};

  #[test]
  fn test_reform_ext_if_needed() {
    assert_eq!(
      reform_ext_if_needed("/path/to/foo.jpg", ImageFormat::Png),
      PathBuf::from("/path/to/foo.png"),
    );

    assert_eq!(
      reform_ext_if_needed(&"/path/to/foo.jpg", ImageFormat::Jpeg),
      PathBuf::from("/path/to/foo.jpg"),
    );

    assert_eq!(
      reform_ext_if_needed("/path/to/foo.JPG", ImageFormat::Jpeg),
      PathBuf::from("/path/to/foo.JPG"),
    );
  }

  #[test]
  fn test_find_unoccupied_file_path() {
    assert_eq!(
      find_unoccupied_file_path("tests/fixtures/file_exists/a.txt"),
      PathBuf::from("tests/fixtures/file_exists/a(2).txt"),
    );

    assert_eq!(
      find_unoccupied_file_path("tests/fixtures/file_exists/b.txt"),
      PathBuf::from("tests/fixtures/file_exists/b(1).txt"),
    );

    assert_eq!(
      find_unoccupied_file_path("tests/fixtures/file_exists/c.txt"),
      PathBuf::from("tests/fixtures/file_exists/c.txt"),
    );
  }
}
