/* global console, process */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FLAGS = ['-fwasm-exceptions', '-sSUPPORT_LONGJMP=wasm'];
const WASM_TARGET = 'wasm32-unknown-emscripten';
const WASM_OUTPUT_FILES = ['minifier-js.js', 'minifier_js.wasm'];

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const packageRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(packageRoot, '../..');
const wasmDir = path.join(packageRoot, 'wasm');
const targetDir = path.join(workspaceRoot, 'target', WASM_TARGET, 'release');

const exitOnError = (message) => {
  console.error(message);
  process.exit(1);
};

const formatError = (error) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const mergeFlags = (...parts) => {
  const tokens = parts
    .filter(Boolean)
    .flatMap((part) => part.trim().split(/\s+/))
    .filter(Boolean);

  const merged = [];
  for (const token of tokens) {
    if (!merged.includes(token)) {
      merged.push(token);
    }
  }

  return merged.join(' ');
};

const createBuildEnv = () => {
  const emsdk = process.env.EMSDK;
  if (!emsdk) {
    exitOnError('Error: EMSDK is not set.');
  }

  const emscriptenDir = path.join(emsdk, 'upstream', 'emscripten');
  if (!fs.existsSync(emscriptenDir)) {
    exitOnError(`Error: Emscripten directory not found: ${emscriptenDir}`);
  }

  const emcmakeFile = path.join(emscriptenDir, 'cmake', 'Modules', 'Platform', 'Emscripten.cmake');

  return {
    ...process.env,
    EMSDK: emsdk,
    CARGO_TARGET_WASM32_UNKNOWN_EMSCRIPTEN_LINKER: 'em++',
    PATH: [emscriptenDir, process.env.PATH].filter(Boolean).join(path.delimiter),
    EMSCRIPTEN_CMAKE_FILE: emcmakeFile,
    PKG_CONFIG_ALLOW_CROSS: '1',
    CFLAGS: mergeFlags(process.env.CFLAGS, ...REQUIRED_FLAGS),
    CXXFLAGS: mergeFlags(process.env.CXXFLAGS, ...REQUIRED_FLAGS),
    LDFLAGS: mergeFlags(process.env.LDFLAGS, ...REQUIRED_FLAGS),
    EMCC_CFLAGS: mergeFlags(process.env.EMCC_CFLAGS, ...REQUIRED_FLAGS),
  };
};

const runCommand = (command, args, options = {}) => {
  try {
    execFileSync(command, args, {
      cwd: packageRoot,
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    exitOnError(`Error running "${command} ${args.join(' ')}": ${formatError(error)}`);
  }
};

const copyBuildArtifacts = () => {
  fs.mkdirSync(wasmDir, { recursive: true });

  for (const file of WASM_OUTPUT_FILES) {
    const src = path.join(targetDir, file);
    const dest = path.join(wasmDir, file);

    if (!fs.existsSync(src)) {
      exitOnError(`Error: expected build artifact not found: ${src}`);
    }

    fs.copyFileSync(src, dest);
  }
};

const buildEnv = createBuildEnv();

runCommand('cargo', ['build', '--release', '--target', WASM_TARGET, '-vv'], {
  env: buildEnv,
});
copyBuildArtifacts();
