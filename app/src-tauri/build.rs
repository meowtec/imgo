fn main() {
  tauri_build::build();

  #[cfg(all(target_env = "msvc", debug_assertions))]
  {
    // println!("cargo:rustc-link-lib=msvcrtd");
  }

  #[cfg(target_env = "msvc")]
  {
    // ignore LNK2005 error for brotli
    println!("cargo:rustc-link-arg=/FORCE");
  }
}
