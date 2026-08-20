use sha2::{self, Digest};
use std::{
  error::Error,
  io::{copy, Read},
};

fn bytes_to_string(bytes: &[u8]) -> String {
  hex::encode(bytes)
}

pub fn hash_from_read<T: Read>(mut file: T) -> Result<String, Box<dyn Error>> {
  let mut context = sha2::Sha512::new();
  copy(&mut file, &mut context)?;
  let result: &[u8] = &context.finalize();
  Ok(bytes_to_string(&result[0..16]))
}

pub fn hash_from_str<S: AsRef<str>>(str: S) -> String {
  hash_from_read(str.as_ref().as_bytes()).unwrap()
}

mod tests {
  #[test]
  fn test_bytes_to_string() {
    assert_eq!(
      super::bytes_to_string(b"hello word"),
      "68656c6c6f20776f7264"
    );
  }

  #[test]
  fn test_hash_from_str() {
    assert_eq!(
      super::hash_from_str("hello word"),
      "86dfecbd488d84481bdfc5d54f52734f"
    );
  }

  #[test]
  fn test_hash_from_read() {
    assert_eq!(
      super::hash_from_read("hello word".as_bytes()).unwrap(),
      "86dfecbd488d84481bdfc5d54f52734f"
    );
  }
}
