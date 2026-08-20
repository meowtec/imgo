use serde::{Deserialize, Serialize};

#[derive(Clone, Debug)]
#[repr(C)]
pub struct Buff {
  ptr: u64,
  len: u64,
  vector: Vec<u8>,
}

impl Buff {
  pub fn new(vector: Vec<u8>) -> Self {
    Self {
      ptr: vector.as_ptr() as u64,
      len: vector.len() as u64,
      vector,
    }
  }

  pub fn new_with_size(size: usize) -> Self {
    let vector = vec![0; size];
    Buff::new(vector)
  }

  pub fn from_data<T: Serialize + ?Sized>(value: &T) -> Self {
    let buffer = rmp_serde::to_vec_named(value).expect("data to buffer");
    Buff::new(buffer)
  }

  pub unsafe fn try_from_raw(ptr: *mut Buff) -> Option<Box<Buff>> {
    if ptr.is_null() {
      return None;
    }

    Some(Box::from_raw(ptr))
  }

  pub fn into_raw(self) -> *mut Buff {
    Box::into_raw(Box::new(self))
  }

  pub fn to_string(&self) -> String {
    String::from_utf8_lossy(self.as_ref()).to_string()
  }

  pub fn into_vec(self) -> Vec<u8> {
    self.vector
  }

  pub fn try_to_data<T: for<'a> Deserialize<'a>>(self) -> Result<T, String> {
    rmp_serde::from_slice(&self.vector).map_err(|err| err.to_string())
  }

  // pub fn vec_from_memory(ptr: *mut Buff) -> Option<Vec<u8>> {
  //   let buff = Buff::from_raw(ptr);

  //   // in case we implement Drop for Buff
  //   buff.map(|mut buff| std::mem::take(buff.vector.as_mut()))
  // }
}

impl AsRef<[u8]> for Buff {
  fn as_ref(&self) -> &[u8] {
    &self.vector
  }
}
