import { describe, expect, test } from 'vitest';
import type { Task } from '@/types';
import type { ImageFormat } from '@imgo/shared-js';
import { shouldSkipBatchSave } from './should-skip-batch-save';

function createTask(
  inputSize: bigint,
  outputSize: bigint,
  outputFormat: ImageFormat = 'JPEG',
): Task {
  return {
    id: 'task',
    input: {
      file: { id: 'input', name: 'input.jpg', size: inputSize },
      format: 'JPEG',
      resolution: null,
    },
    outputFormat,
    options: {},
    result: {
      status: 'completed',
      saved: false,
      result: {
        file: { id: 'output', name: 'output.jpg', size: outputSize },
        format: outputFormat,
        resolution: null,
      },
    },
  };
}

describe('shouldSkipBatchSave', () => {
  test('does not skip when disabled', () => {
    expect(
      shouldSkipBatchSave(createTask(100n, 200n), {
        skipSaveType: 'NONE',
        skipSaveMinRatio: 1,
      }),
    ).toBe(false);
  });

  test('skips matching formats above the configured ratio', () => {
    expect(
      shouldSkipBatchSave(createTask(100n, 101n), {
        skipSaveType: 'SAME_FORMAT',
        skipSaveMinRatio: 1,
      }),
    ).toBe(true);
  });

  test('does not skip converted formats in same-format mode', () => {
    expect(
      shouldSkipBatchSave(createTask(100n, 200n, 'WEBP'), {
        skipSaveType: 'SAME_FORMAT',
        skipSaveMinRatio: 1,
      }),
    ).toBe(false);
  });

  test('skips converted formats in all-formats mode', () => {
    expect(
      shouldSkipBatchSave(createTask(100n, 200n, 'WEBP'), {
        skipSaveType: 'ALL',
        skipSaveMinRatio: 1,
      }),
    ).toBe(true);
  });

  test('does not skip at the configured ratio boundary', () => {
    expect(
      shouldSkipBatchSave(createTask(100n, 100n), {
        skipSaveType: 'ALL',
        skipSaveMinRatio: 1,
      }),
    ).toBe(false);
  });
});
