import { describe, expect, test } from 'vitest';
import { supportsLossless } from './format';

describe('supportsLossless', () => {
  test.each(['PNG', 'WEBP', 'AVIF', 'HEIC', 'JXL'] as const)('supports %s', (format) => {
    expect(supportsLossless(format)).toBe(true);
  });

  test.each(['JPEG', 'GIF', 'BMP', 'TIFF'] as const)('does not support %s', (format) => {
    expect(supportsLossless(format)).toBe(false);
  });
});
