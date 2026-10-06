import { describe, expect, test } from 'vitest';
import { migrateLegacyAppOptions } from './migrate-app-options';

describe('migrateLegacyAppOptions', () => {
  test('converts the sentinel schema to the current one', () => {
    const migrated = migrateLegacyAppOptions({
      globalDefaultOptions: [
        { inputFormats: ['*'], outputFormat: '__SAME__', options: { quality: 75 } },
        { inputFormats: ['PNG', 'JPEG'], outputFormat: 'WEBP', options: {} },
      ],
    });

    expect(migrated.globalDefaultOptions).toEqual([
      { inputFormats: [], outputFormat: null, options: { quality: 75 } },
      { inputFormats: ['PNG', 'JPEG'], outputFormat: 'WEBP', options: {} },
    ]);
  });

  test('drops the all-format sentinel from mixed lists', () => {
    const migrated = migrateLegacyAppOptions({
      globalDefaultOptions: [{ inputFormats: ['*', 'PNG'], outputFormat: 'WEBP' }],
    });

    expect(migrated.globalDefaultOptions?.[0].inputFormats).toEqual(['PNG']);
  });

  test('keeps non-profile fields', () => {
    const migrated = migrateLegacyAppOptions({ skipSaveType: 'ALL', confirmOnClose: false });

    expect(migrated.skipSaveType).toBe('ALL');
    expect(migrated.confirmOnClose).toBe(false);
    expect(migrated.globalDefaultOptions).toBeUndefined();
  });
});
