use std::{
  fmt::Display,
  time::{self},
};

use log::debug;
use minifier::{optimize_image, ImageFormat, OptimizeOptions};
use save_files::SaveFilesTriggerType;
use tauri::{async_runtime::spawn_blocking, AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs as tfs;

use crate::{
  message::{FileAddCompleteMessage, FileAddProgressMessager, FileAddStartMessage},
  oss::{
    self, add_files_to_images, generate_file_name, read_file_data, walk_dir_add_images,
    write_file_data,
  },
  structs::{FileObject, ImageObject, ImageOptimizeResult},
  utils::hash_from_str,
};

pub mod about;
pub mod save_files;

fn err_to_string(err: impl Display) -> String {
  format!("{}", err)
}

pub fn start_emit_file_add<R: tauri::Runtime, T: Emitter<R>>(
  emitter: &T,
  total_size: usize,
) -> String {
  let id = nanoid::nanoid!();

  emitter
    .emit(
      "file-add-start",
      FileAddStartMessage {
        id: id.clone(),
        total_size,
      },
    )
    .expect("send file-add-start to client");

  id
}

pub fn emit_file_add<R: tauri::Runtime, T: Emitter<R>>(
  emitter: &T,
  id: String,
  images: Vec<ImageObject>,
) {
  emitter
    .emit(
      "file-add",
      FileAddCompleteMessage { id, images },
    )
    .expect("send file-add to client");
}

// pub mod optimize;
// pub mod save_files;
// pub mod select_files;

#[tauri::command]
pub fn pick_files(app_handle: AppHandle) {
  let dialog_builder = app_handle.dialog().file().add_filter(
    "image",
    &[
      "png", "jpg", "jpeg", "gif", "webp", "avif", "heic", "heif", "jxl",
    ],
  );
  dialog_builder.pick_files(move |result| {
    if let Some(files) = result {
      let id = start_emit_file_add(&app_handle, files.len());
      let mut file_add_process_messager = FileAddProgressMessager::new(id.clone(), &app_handle);

      let file_paths = files
        .iter()
        .filter_map(|file_path| match file_path {
          tfs::FilePath::Url(_) => None,
          tfs::FilePath::Path(path_buf) => Some(path_buf.clone()),
        })
        .collect::<Vec<_>>();

      let result = add_files_to_images(
        &file_paths,
        &mut file_add_process_messager,
      );
      debug!(
        "select files: {:?}, to {:?}",
        &files, &result,
      );

      emit_file_add(&app_handle, id, result);
    }
  });
}

#[tauri::command]
pub fn pick_folders(app_handle: AppHandle) {
  app_handle.dialog().file().pick_folders(move |result| {
    debug!("select folders: {:?}", result);
    if let Some(dirs) = result {
      let id = start_emit_file_add(&app_handle, 0);
      let mut file_add_process_messager = FileAddProgressMessager::new(id.clone(), &app_handle);

      let images = dirs
        .iter()
        .flat_map(|dir| match dir {
          tfs::FilePath::Url(_) => vec![],
          tfs::FilePath::Path(path_buf) => {
            walk_dir_add_images(path_buf, &mut file_add_process_messager)
          }
        })
        .collect::<Vec<_>>();

      debug!(
        "select {} images from folders",
        images.len()
      );
      emit_file_add(&app_handle, id, images);
    }
  });
}

#[tauri::command]
pub async fn optimize(
  file: FileObject,
  output_format: ImageFormat,
  options: OptimizeOptions,
  id_prefix: Option<String>,
) -> Result<ImageOptimizeResult, String> {
  spawn_blocking(move || {
    let hash = hash_from_str(
      serde_json::to_string(&(&file, &output_format, &options)).map_err(err_to_string)?,
    );

    let result_id = id_prefix.unwrap_or_default() + &generate_file_name(hash, output_format);

    log::info!("optimize_image start: {}", &result_id);

    let content = read_file_data(&file.id).map_err(err_to_string)?;
    log::info!(
      "optimize_image miss cache: {}",
      &result_id
    );
    let start = time::Instant::now();
    let output = optimize_image(
      &content,
      Some(output_format),
      Some(options),
      Some(&result_id),
    )
    .map_err(err_to_string)?;
    log::info!(
      "optimize_image finish: {}, {:?}",
      &result_id,
      start.elapsed()
    );
    write_file_data(&result_id, &output.data).map_err(err_to_string)?;

    let result = ImageOptimizeResult {
      input_resolution: output.input_resolution,
      image: ImageObject {
        file: FileObject {
          id: result_id.clone(),
          size: output.data.len() as u64,
          name: file.name.clone(),
        },
        resolution: Some(output.output_resolution),
        format: output_format,
      },
    };

    Ok(result)
  })
  .await
  .unwrap_or_else(|err| Err(err.to_string()))
}

#[tauri::command]
pub async fn clear_all() {
  oss::clear_all();
}

#[tauri::command]
pub async fn clear_files(ids: Vec<String>) {
  oss::clear_files(&ids);
}

#[tauri::command]
pub async fn save_files(
  app_handle: AppHandle,
  images: Vec<ImageObject>,
  save_type: SaveFilesTriggerType,
) -> Vec<String> {
  return save_files::blocking_save_files(app_handle, images, save_type);
}
