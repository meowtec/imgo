fn main() {
  #[cfg(all(target_env = "msvc", debug_assertions))]
  {
    // println!("cargo:rustc-link-lib=msvcrtd");
  }
}
