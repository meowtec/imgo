fn main() {
  let target_os: String = std::env::var("CARGO_CFG_TARGET_OS").unwrap();

  if target_os == "emscripten" {
    println!("cargo:rustc-link-arg=-lembind");
    // println!("cargo:rustc-link-arg=--embind-emit-tsd");
    println!("cargo:rustc-link-arg=-fwasm-exceptions");
    println!("cargo:rustc-link-arg=-sSUPPORT_LONGJMP=wasm");
    println!("cargo:rustc-link-arg=-sEXPORTED_FUNCTIONS=_optimize_image,_get_format_from_path,_get_format_from_buffer,_alloc_buff,_free_buff");
    println!("cargo:rustc-link-arg=-sEXPORTED_RUNTIME_METHODS=HEAPU8");
    println!("cargo:rustc-link-arg=-sSTACK_SIZE=5mb");
    println!("cargo:rustc-link-arg=-sINITIAL_MEMORY=10mb");
    println!("cargo:rustc-link-arg=-sALLOW_MEMORY_GROWTH=1");
    println!("cargo:rustc-link-arg=-sMODULARIZE=1");
    println!("cargo:rustc-link-arg=-sEXPORT_ES6=1");

    // println!("cargo:rustc-link-arg=-sTOTAL_MEMORY=2000mb");
    // println!("cargo:rustc-link-arg=-sMAXIMUM_MEMORY=4gb");
  }
}
