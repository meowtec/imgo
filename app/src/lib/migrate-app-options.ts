import type { ImageFormat, OptimizeOptions } from '@imgo/shared-js';
import { ALL_FORMAT, SAME_FORMAT } from '@/types';
import type { AppOptions } from '@/types';

/** Shape written by the previous zustand `persist` middleware (sentinel based). */
export interface LegacyProfile {
  inputFormats?: string[];
  outputFormat?: string | null;
  options?: OptimizeOptions;
}

export type LegacyAppOptions = Omit<Partial<AppOptions>, 'globalDefaultOptions'> & {
  globalDefaultOptions?: LegacyProfile[];
};

export interface LegacyPersistedState {
  state?: {
    appOptions?: LegacyAppOptions;
  };
}

/**
 * Convert options persisted by the old sentinel-based schema to the current one.
 *
 * This is the single migration point for legacy data: it is applied when reading
 * the old zustand `persist` localStorage entry. The Rust-owned config file is
 * always expected to be in the current schema.
 *
 * `"*"` entries in `inputFormats` are dropped (an empty list now means
 * "all formats") and `"__SAME__"` output formats become `null`.
 */
export function migrateLegacyAppOptions(options: LegacyAppOptions): Partial<AppOptions> {
  const { globalDefaultOptions: profiles, ...rest } = options;

  return {
    ...rest,
    globalDefaultOptions: profiles?.map((profile) => ({
      inputFormats: (profile.inputFormats ?? []).filter(
        (format): format is ImageFormat => format !== ALL_FORMAT,
      ),
      outputFormat:
        profile.outputFormat === SAME_FORMAT
          ? null
          : ((profile.outputFormat as ImageFormat | undefined) ?? null),
      options: profile.options ?? {},
    })),
  };
}
