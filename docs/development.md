# Development

See [Architecture](./architecture.md) for the repository structure, runtime boundaries, and codec support matrix.

## Requirements

- Node.js `^24.18.0`
- pnpm `^11`
- Rust through `rustup`
- Rust targets `wasm32-unknown-unknown` and `wasm32-unknown-emscripten`
- `wasm-pack`
- CMake
- Emscripten SDK (`emsdk`)
- Meson
- Ninja
- A C/C++ toolchain

Platform toolchains:

- macOS: Xcode Command Line Tools or an equivalent Clang toolchain
- Linux: GCC or Clang and the standard C/C++ build tools
- Windows: MSVC Build Tools

Activate the Emscripten environment in the current shell before building. The `EMSDK` environment variable is required by `crates/minifier-js/scripts/build.js` and `deps/libheif-sys/build.rs`.

## Initial Setup

For a clean checkout:

```bash
git submodule update --init --recursive
pnpm run init
```

`pnpm run init`:

1. Initializes all Git submodules.
2. Applies the repository patches under `deps/`.
3. Builds `crates/shared-js`.
4. Installs JavaScript dependencies.
5. Builds the `@imgo/minifier-js` JavaScript wrapper.
6. Builds the `@imgo/minifier-js` WebAssembly package.

The command runs `init:src`, which resets the working trees of `deps/libheif-sys`, `deps/libheif`, and `deps/jpegxl-rs` before applying patches. Do not run it when those submodules contain local changes that must be preserved.

## Development Commands

Run the desktop app:

```bash
pnpm --dir app dev:app
```

Run the shared app frontend in web mode:

```bash
pnpm --dir app dev:web
```

Run the Astro website:

```bash
pnpm --dir website dev
```

Rebuild the shared JavaScript bindings:

```bash
pnpm run rsts
```

Rebuild the Emscripten WebAssembly artifacts under `crates/minifier-js/wasm/`:

```bash
pnpm --dir crates/minifier-js build:wasm
```

Build the JavaScript wrapper entrypoints under `crates/minifier-js/lib/`:

```bash
pnpm --filter @imgo/minifier-js build
```

Run the native CLI:

```bash
cargo run -p minifier-cli -- --input ./input.png --output ./output.png
```

## Validation

Run the full lint and test suites:

```bash
pnpm lint
pnpm test
```

Useful focused checks:

```bash
pnpm --dir app test
pnpm --dir crates/minifier-js test
```

The CI workflow runs linting, tests, and the complete WebAssembly and web builds for pull requests and pushes to `main`.

## Desktop Releases

Pushing a `vX.Y.Z` tag runs `.github/workflows/release.yml`. The tag version must match:

- `app/src-tauri/tauri.conf.json`
- `app/package.json`
- `app/src-tauri/Cargo.toml`

The release is published only after all six native builds succeed:

| Platform | Architecture | Artifact       |
| -------- | ------------ | -------------- |
| Linux    | x64 / ARM64  | AppImage       |
| Windows  | x64 / ARM64  | NSIS installer |
| macOS    | x64 / ARM64  | DMG            |

The manual workflow trigger rebuilds an existing release tag. Windows installers are unsigned, and macOS bundles use ad hoc signing without notarization.

## Contributor Notes

- The web image processor targets `wasm32-unknown-emscripten`, not `wasm32-unknown-unknown`.
- Sources under `deps/` are patch-bearing submodules, not plain mirrors.
- Changes to submodule code usually require updating the corresponding `.patch` file in the repository root.
- The `app` package serves both Tauri and web runtimes; platform-specific frontend code belongs in `app/src/platform/`.
