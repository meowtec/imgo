use std::{
  fs::{self, Metadata},
  io::{self, Cursor, Read},
  path::{Path, PathBuf},
  sync::OnceLock,
};

use minifier::{detect_format_from_buffer, ImageFormat};
use tauri::{Emitter, Runtime};

use crate::{
  message::FileAddProgressMessager,
  structs::{FileObject, ImageObject},
  utils::hash_from_read,
};

static OSS_PATH: OnceLock<PathBuf> = OnceLock::new();

fn clear_dir(path: &Path) {
  fs::remove_dir_all(path).ok();
}

pub fn generate_file_name(hash: String, format: ImageFormat) -> String {
  hash + "." + format.extensions_str()
}

pub fn setup(path: &Path) {
  clear_dir(path);
  fs::create_dir_all(path.join("thumb")).unwrap_or_else(|_| {
    panic!(
      "can not create oss path: {}",
      path.to_string_lossy()
    )
  });
  OSS_PATH.set(path.to_path_buf()).unwrap();
}

pub fn get_file_metadata(id: &str) -> io::Result<Metadata> {
  fs::metadata(get_file_path(id))
}

pub fn get_root_path() -> PathBuf {
  OSS_PATH.get().unwrap().clone()
}

pub fn get_file_path(id: &str) -> PathBuf {
  OSS_PATH.get().unwrap().join(id)
}

pub fn read_file_data(id: &str) -> io::Result<Vec<u8>> {
  fs::read(get_file_path(id))
}

pub async fn read_file_data_async(id: &str) -> io::Result<Vec<u8>> {
  tokio::fs::read(get_file_path(id)).await
}

pub fn write_file_data(id: &str, data: &[u8]) -> io::Result<()> {
  fs::write(get_file_path(id), data)
}

pub async fn write_file_data_async(id: &str, data: &[u8]) -> io::Result<()> {
  tokio::fs::write(get_file_path(id), data).await
}

pub fn clear_all() {
  clear_dir(OSS_PATH.get().unwrap());
}

pub fn clear_files(ids: &[String]) {
  for id in ids {
    fs::remove_file(get_file_path(id)).ok();
  }
}

pub fn add_file_to_image(file_path: &Path) -> anyhow::Result<ImageObject> {
  let buffer = fs::read(file_path)?;
  let size = buffer.len() as u64;

  let format = detect_format_from_buffer(&buffer).ok_or(anyhow::anyhow!(
    "unknown file format: {}",
    file_path.to_str().unwrap_or_default()
  ))?;

  let hash_chain = Cursor::new(&buffer).chain(file_path.as_os_str().as_encoded_bytes());
  let id = generate_file_name(
    hash_from_read(hash_chain).map_err(|_| anyhow::anyhow!("can not read hash"))?,
    format,
  );

  write_file_data(&id, &buffer)?;

  let filename = file_path.to_string_lossy();

  Ok(ImageObject {
    file: FileObject {
      id,
      size,
      name: filename.to_string(),
    },
    format,
    resolution: None,
  })
}

/// 传入一组文件路径，获取文件格式，将图片文件保存到 OSS_PATH 下，并返回 ImageObject 列表
pub fn add_files_to_images<E: Emitter<R>, R: Runtime>(
  paths: &[PathBuf],
  file_add_process_messager: &mut FileAddProgressMessager<E, R>,
) -> Vec<ImageObject> {
  let list = paths
    .iter()
    .map(|file_path| {
      file_add_process_messager.process(file_path.file_name().unwrap_or_default());

      add_file_to_image(file_path)
    })
    .filter_map(
      |result: Result<ImageObject, anyhow::Error>| match result {
        Ok(data) => Some(data),
        Err(err) => {
          log::error!("prepare image failed: {:?}", err);
          None
        }
      },
    )
    .collect();

  println!("add_files_to_images: {:?}", &list);

  list
}

pub fn walk_dir_add_images<E: Emitter<R>, R: Runtime>(
  dir: &Path,
  file_add_process_messager: &mut FileAddProgressMessager<E, R>,
) -> Vec<ImageObject> {
  walkdir::WalkDir::new(dir)
    .into_iter()
    .filter_map(|x| match x {
      Ok(dir_entry) => {
        file_add_process_messager.process(dir_entry.file_name());

        if dir_entry.file_type().is_file()
          && !dir_entry
            .file_name()
            .to_str()
            .unwrap_or_default()
            .starts_with('.')
          && dir_entry
            .path()
            .extension()
            .and_then(ImageFormat::detect_from_extension)
            .is_some()
        {
          match add_file_to_image(dir_entry.path()) {
            Ok(data) => Some(data),
            Err(err) => {
              log::error!("prepare image failed: {:?}", err);
              None
            }
          }
        } else {
          None
        }
      }
      Err(_) => None,
    })
    .collect::<Vec<_>>()
}
