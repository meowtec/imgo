import { Packr } from 'msgpackr';
import init from '../wasm/minifier-js.js';
import { ImageFormat, ImageResolution, OptimizeOptions } from '@imgo/shared-js';

type OptimizeResult =
  | {
      code: number;
      message?: string;
    }
  | {
      buffer_ptr: number;
      output_format: ImageFormat;
      input_resolution: ImageResolution;
      output_resolution: ImageResolution;
    };

interface WasmModule {
  _alloc_buff(length: number): number;
  _free_buff(ptr: number): void;
  _optimize_image(buffPtr: number, targetFormatPtr: number, optionsPtr: number): number;
  _get_format_from_path(pathPtr: number): number;
  _get_format_from_buffer(bufferPtr: number): number;
  HEAPU8?: Uint8Array;
}

const packer = new Packr({
  useRecords: false,
  encodeUndefinedAsNil: true,
});

export async function initWasmModule() {
  const mod = (await init()) as unknown as WasmModule;

  function getHeapU8() {
    const heap = mod.HEAPU8;
    if (heap == null) {
      throw new Error(
        'Emscripten heap view is not exported. Rebuild the wasm with -sEXPORTED_RUNTIME_METHODS=HEAPU8.',
      );
    }

    return heap;
  }

  function transferBuffer(buffer: Uint8Array) {
    const ptr = mod._alloc_buff(buffer.length);
    const heap = getHeapU8();
    const bufferPtr = new DataView(heap.buffer, ptr).getBigUint64(0, true);
    getHeapU8().set(buffer, Number(bufferPtr));

    return ptr;
  }

  function freeBuffer(ptr: number) {
    mod._free_buff(ptr);
  }

  function borrowBuffer(ptr: number) {
    const heap = getHeapU8();
    const dataView = new DataView(heap.buffer, ptr);
    const buffer_ptr = dataView.getBigUint64(0, true);
    const buffer_size = dataView.getBigUint64(8, true);

    const array = new Uint8Array(heap.buffer, Number(buffer_ptr), Number(buffer_size));

    return array;
  }

  function takeBuffer(ptr: number) {
    const buf = new Uint8Array(borrowBuffer(ptr));
    freeBuffer(ptr);
    return buf;
  }

  function transferStruct<T>(structure: T) {
    const packed = packer.pack(structure ?? null) as unknown as Uint8Array;
    return transferBuffer(packed);
  }

  function takeStruct<T>(ptr: number): T {
    const buf = borrowBuffer(ptr);
    const struct = packer.unpack(buf) as T;
    freeBuffer(ptr);
    return struct;
  }

  const minify = (
    image: Uint8Array,
    targetFormat: ImageFormat | null,
    options: OptimizeOptions,
  ) => {
    const imagePtr = transferBuffer(image);
    const optionsPtr = transferStruct(options);
    const targetFormatPtr = transferStruct(targetFormat);

    const resultPtr = mod._optimize_image(imagePtr, targetFormatPtr, optionsPtr);

    const result = takeStruct<OptimizeResult>(resultPtr);
    if ('code' in result) {
      throw new Error(result.message ?? 'optimize_image failed');
    }

    const data = takeBuffer(result.buffer_ptr);

    return {
      data,
      outputFormat: result.output_format,
      inputResolution: result.input_resolution,
      outputResolution: result.output_resolution,
    };
  };

  const getFormatFromPath = (path: string) => {
    const pathPtr = transferBuffer(new TextEncoder().encode(path));
    const formatPtr = mod._get_format_from_path(pathPtr);

    const result = takeStruct<ImageFormat | null>(formatPtr);
    return result;
  };

  const getFormatFromBuffer = (buffer: Uint8Array) => {
    const bufferPtr = transferBuffer(buffer);
    const formatPtr = mod._get_format_from_buffer(bufferPtr);

    const result = takeStruct<ImageFormat | null>(formatPtr);
    return result;
  };

  return {
    minify,
    getFormatFromPath,
    getFormatFromBuffer,
  };
}
