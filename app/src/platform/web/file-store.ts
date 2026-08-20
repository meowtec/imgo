import { openDB } from 'idb';
import { nanoid } from 'nanoid';
import { initWasmModule } from '@imgo/minifier-js';
import type { ImageFormat } from '@imgo/shared-js';
import type { ImageObjectExt } from '@/types';
import { mutations } from '@/store';

const DB_NAME = 'files';
const FILE_STORE_NAME = 'files';
const DB_VERSION = 1;

const idbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database, oldVersion) {
    if (!oldVersion) {
      database.createObjectStore(FILE_STORE_NAME);
    }
  },
});

void idbPromise.then((idb) => {
  void idb.clear(FILE_STORE_NAME);
});

let mainWasmPromise: ReturnType<typeof initWasmModule> | null = null;

function getMainWasm() {
  mainWasmPromise ??= initWasmModule();
  return mainWasmPromise;
}

export async function addFile(id: string, data: Blob) {
  const idb = await idbPromise;
  await idb.put(FILE_STORE_NAME, data, id);
}

export async function getFile(id: string): Promise<Blob | undefined> {
  const idb = await idbPromise;
  return idb.get(FILE_STORE_NAME, id) as Promise<Blob | undefined>;
}

export async function getImageFormat(file: File): Promise<ImageFormat | null> {
  const [mainWasm, bufferSample] = await Promise.all([
    getMainWasm(),
    file.slice(0, 1024).arrayBuffer(),
  ]);

  return mainWasm.getFormatFromBuffer(new Uint8Array(bufferSample));
}

export async function prepareFiles(files: File[]) {
  const images: ImageObjectExt[] = [];
  for (const file of files) {
    const format = await getImageFormat(file);
    if (format) {
      const id = nanoid();
      await addFile(id, file);
      const image: ImageObjectExt = {
        file: {
          id,
          name: file.name,
          size: BigInt(file.size),
        },
        format,
        resolution: null,
      };
      images.push(image);
    }
  }

  mutations.addTasks(images);
}

export async function clearFilesById(ids: string[]) {
  const idb = await idbPromise;
  for (const id of ids) {
    await idb.delete(FILE_STORE_NAME, id);
  }
}
