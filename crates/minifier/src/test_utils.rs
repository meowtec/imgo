#[cfg(test)]
pub mod test_utils {
  use std::path::PathBuf;

  pub fn read_samples_file_buffer(relative_path: &str) -> Vec<u8> {
    let mut path_buf = PathBuf::from("samples");
    path_buf.push(relative_path);
    std::fs::read(path_buf).unwrap()
  }

  pub fn write_samples_file_buffer(relative_path: &str, buffer: &[u8]) {
    let mut path_buf = PathBuf::from("samples");
    path_buf.push(relative_path);

    if let Some(parent_dir) = path_buf.parent() {
      if !parent_dir.exists() {
        std::fs::create_dir_all(parent_dir).expect("Failed to create directory");
      }
    }

    std::fs::write(path_buf, buffer).unwrap();
  }
}
