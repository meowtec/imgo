import { useEffect, useState } from 'react';
import { downloadZip } from 'client-zip';
export { showConfirm } from '@/components/alert-dialog/api';
import { sha256 } from '@/lib/utils';
import type { ApiCalls, Tuple2Api } from '../shared/types';
import { addFile, clearFilesById, getFile, prepareFiles } from './file-store';
import { invoke } from './workers';
import { saveFileToLocal } from '@/lib/fs';
import { getExtension } from '@imgo/shared-js';
import type { ImageFormat } from '@imgo/shared-js';

export function listenEvents() {}

function normalizeDownloadFileName(name: string, format: ImageFormat) {
  const extension = getExtension(format);
  const baseName = name.replace(/\.[^./\\]*$/, '');
  return `${baseName}.${extension}`.normalize('NFC');
}

export function useFileUrl(id: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let canceled = false;
    let cancel = () => {};

    void (async () => {
      const blob = await getFile(id);
      if (!blob || canceled) return;
      const u = URL.createObjectURL(blob);
      cancel = () => {
        URL.revokeObjectURL(u);
      };
      setUrl(u);
    })();

    return () => {
      canceled = true;
      cancel();
    };
  }, [id]);

  return url;
}

export const optimize: Tuple2Api<ApiCalls['optimize']> = async (params) => {
  const blob = await getFile(params.file.id);

  if (!blob) {
    throw new Error('File not found: ' + params.file.id);
  }

  const resultId = await sha256(
    JSON.stringify({
      id: params.file.id,
      outputFormat: params.outputFormat,
      options: params.options,
    }),
  );
  const result = await invoke('optimize', blob, params.outputFormat, params.options);
  await addFile(resultId, result.data);

  return {
    image: {
      file: {
        id: resultId,
        name: params.file.name,
        size: BigInt(result.data.size),
      },
      format: result.outputFormat,
      resolution: result.outputResolution,
    },
    inputResolution: result.inputResolution,
  };
};

export const openSelectFilesDialog: Tuple2Api<ApiCalls['pick_files']> = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.click();

  input.onchange = () => {
    const { files } = input;
    if (files?.length) {
      void prepareFiles(Array.from(files));
    }
  };

  return Promise.resolve();
};

export const addFiles: Tuple2Api<ApiCalls['add_files']> = async ({ files }) => {
  await prepareFiles(files);
};

export const openSelectFoldersDialog: Tuple2Api<ApiCalls['pick_folders']> = () => {
  throw new Error('unimplement');
};

export const saveFiles: Tuple2Api<ApiCalls['save_files']> = async (params) => {
  const count = params.images.length;
  if (count === 1) {
    const blob = await getFile(params.images[0].file.id);
    if (!blob) {
      throw new Error('File not found: ' + params.images[0].file.id);
    }

    saveFileToLocal(
      normalizeDownloadFileName(params.images[0].file.name, params.images[0].format),
      blob,
    );
  } else if (count > 1) {
    const files: Array<{ name: string; input: Blob }> = [];
    for (const image of params.images) {
      const blob = await getFile(image.file.id);
      if (!blob) {
        throw new Error('File not found: ' + image.file.id);
      }

      files.push({
        name: normalizeDownloadFileName(image.file.name, image.format),
        input: blob,
      });
    }

    const blob = await downloadZip(files).blob();
    saveFileToLocal('images-compressed.zip', blob);
  }

  return params.images.map((image) => image.file.id);
};

export const clearFiles: Tuple2Api<ApiCalls['clear_files']> = async (params) => {
  return clearFilesById(params.ids);
};
