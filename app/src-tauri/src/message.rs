use std::{ffi::OsStr, marker::PhantomData, time::Instant};

use crate::structs::ImageObject;
use log::debug;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Runtime};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileAddStartMessage {
  pub id: String,
  pub total_size: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileAddProcessingMessage {
  pub id: String,
  pub file_name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileAddCompleteMessage {
  pub id: String,
  pub images: Vec<ImageObject>,
}

pub struct FileAddProgressMessager<'a, E: Emitter<R>, R: Runtime> {
  id: String,
  emitter: &'a E,
  last_time: Instant,
  _marker: PhantomData<R>,
}

impl<'a, E: Emitter<R>, R: Runtime> FileAddProgressMessager<'a, E, R> {
  pub fn new(id: String, emitter: &'a E) -> Self {
    Self {
      id,
      emitter,
      last_time: Instant::now(),
      _marker: PhantomData,
    }
  }

  pub fn process(&mut self, file_name: &OsStr) {
    if self.last_time.elapsed().as_millis() < 16 {
      return;
    }

    debug!("file-add-processing: {:?}", file_name);
    self.last_time = Instant::now();
    self
      .emitter
      .emit(
        "file-add-progress",
        FileAddProcessingMessage {
          id: self.id.clone(),
          file_name: file_name.to_string_lossy().to_string(),
        },
      )
      .expect("send file-add-progress to client");
  }
}
