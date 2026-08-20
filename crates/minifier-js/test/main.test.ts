import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { ImageFormat } from '@imgo/shared-js';
import { fileURLToPath } from 'node:url';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { initWasmModule } from '../js-src/wrapper';

expect.extend({ toMatchImageSnapshot });

const modPromise = initWasmModule();

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

test('getFormatFromPath', async () => {
  const mod = await modPromise;

  expect(mod.getFormatFromPath('a.gif')).toBe<ImageFormat>('GIF');
  expect(mod.getFormatFromPath('a.jpg')).toBe<ImageFormat>('JPEG');
  expect(mod.getFormatFromPath('a.avif')).toBe<ImageFormat>('AVIF');
});

test('getFormatFromBuffer', async () => {
  const mod = await modPromise;

  const heifBuffer = readFileSync(resolvePath('./fixtures/128x128.heic')).subarray(0, 1024);
  expect(mod.getFormatFromBuffer(heifBuffer)).toBe<ImageFormat>('HEIC');
  const pngBuffer = readFileSync(resolvePath('./fixtures/128x128.png')).subarray(0, 1024);
  expect(mod.getFormatFromBuffer(pngBuffer)).toBe<ImageFormat>('PNG');
});

test('minify', async () => {
  const mod = await modPromise;
  const pngBuffer = readFileSync(resolvePath('./fixtures/128x128.png'));

  const convertDefault = (buffer: Uint8Array, format: ImageFormat) =>
    mod.minify(buffer, format, {
      quality: 70,
    }).data;

  const tryConvertJxlDefault = (buffer: Uint8Array) => {
    try {
      return convertDefault(buffer, 'JXL');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unsupported format: Jxl')) {
        return null;
      }

      throw error;
    }
  };

  expect(
    Buffer.from(convertDefault(convertDefault(pngBuffer, 'AVIF'), 'PNG')),
  ).toMatchImageSnapshot();
  expect(
    Buffer.from(convertDefault(convertDefault(pngBuffer, 'HEIC'), 'PNG')),
  ).toMatchImageSnapshot({
    failureThresholdType: 'percent',
    failureThreshold: 0.02,
  });
  const jxlEncodedBuffer = tryConvertJxlDefault(pngBuffer);
  const jxlBuffer = jxlEncodedBuffer == null ? null : convertDefault(jxlEncodedBuffer, 'PNG');
  if (jxlBuffer != null) {
    expect(Buffer.from(jxlBuffer)).toMatchImageSnapshot();
  }
});
