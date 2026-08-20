# Architecture

IMGo is a Rust-first image optimization and transcoding monorepo. It shares one core processing stack across multiple runtimes:

- Native CLI
- Tauri desktop app
- WebAssembly web runtime
- JavaScript packages

## Repository Layout

- `crates/minifier` - core image optimization and transcoding logic for PNG, JPEG, WebP, AVIF, HEIF, JXL, and related formats
- `crates/minifier-cli` - command-line entry point for local validation and batch workflows
- `crates/minifier-js` - Emscripten-based WebAssembly package for web usage
- `crates/shared` / `crates/shared-js` - shared Rust and JavaScript data structures and bindings
- `app` - shared React and Vite frontend, packaged with Tauri for desktop
- `website` - Astro website that embeds the web runtime
- `deps` - vendored third-party sources managed as Git submodules, plus local patches

## Runtime Model

The desktop and web applications share the same frontend and data structures while using platform-specific processing backends.

- The desktop app invokes the native Rust `minifier` crate through Tauri.
- The web app invokes `crates/minifier-js`, compiled for `wasm32-unknown-emscripten`.
- Platform-specific frontend integrations live under `app/src/platform/`.
- Shared Rust types are exposed to JavaScript through `crates/shared-js`.

## Format Support

The table below describes codec support in the processing stack. Browser preview support may still vary, and the application UI intentionally exposes a smaller set of popular output formats.

| Format           | Native decode | Native encode | WebAssembly decode | WebAssembly encode | Notes                                                    |
| ---------------- | ------------- | ------------- | ------------------ | ------------------ | -------------------------------------------------------- |
| PNG / APNG       | Yes           | Yes           | Yes                | Yes                | Animated PNG is supported for decode and encode.         |
| JPEG             | Yes           | Yes           | Yes                | Yes                | Encoding is single-frame; alpha is flattened onto white. |
| GIF              | Yes           | Yes           | Yes                | Yes                | Animated GIF is supported for decode and encode.         |
| WebP             | Yes           | Yes           | Yes                | Yes                | Animated WebP is supported for decode and encode.        |
| AVIF             | Yes           | Yes           | Yes                | Yes                | Animated AVIF is supported by the core pipeline.         |
| HEIC / HEIF      | Yes           | Yes           | Yes                | Yes                | Single-frame only.                                       |
| JXL              | Yes           | Yes           | No                 | No                 | Single-frame only; not compiled into `minifier-js`.      |
| BMP              | Yes           | Yes           | Yes                | Yes                | Single-frame only.                                       |
| TIFF             | Yes           | Yes           | Yes                | Yes                | Single-frame only.                                       |
| PNM              | Yes           | Yes           | No                 | No                 | Single-frame only.                                       |
| TGA              | No            | Yes           | No                 | No                 | Input detection does not currently recognize TGA.        |
| ICO              | Yes           | Yes           | No                 | No                 | Single-frame only.                                       |
| HDR              | Yes           | Yes           | No                 | No                 | Single-frame only.                                       |
| OpenEXR          | Yes           | Yes           | No                 | No                 | Single-frame only.                                       |
| Farbfeld (`.ff`) | Yes           | Yes           | No                 | No                 | Single-frame only.                                       |
| QOI              | Yes           | Yes           | No                 | No                 | Single-frame only.                                       |
| DDS              | No            | No            | No                 | No                 | Retained in the shared enum for compatibility.           |
