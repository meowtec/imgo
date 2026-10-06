import { loadAppOptions, saveAppOptions } from '@/platform';
import { mutations, withDefaultAppOptions } from '@/store';
import type { AppOptions } from '@/types';
import { migrateLegacyAppOptions } from './migrate-app-options';
import type { LegacyPersistedState } from './migrate-app-options';

const LEGACY_PERSIST_KEY = 'minifier';

function readLegacyAppOptions(): Partial<AppOptions> | null {
  try {
    const raw = localStorage.getItem(LEGACY_PERSIST_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LegacyPersistedState;
    const appOptions = parsed?.state?.appOptions;

    return appOptions && typeof appOptions === 'object'
      ? migrateLegacyAppOptions(appOptions)
      : null;
  } catch {
    return null;
  }
}

/**
 * Hydrate app options from the platform store before the UI renders.
 *
 * On desktop the options live in a Rust-owned config file (read through a Tauri
 * command); on web they live in localStorage. Options written by the previous
 * zustand `persist` middleware are migrated once and the legacy key removed.
 */
export async function initAppOptions(): Promise<void> {
  try {
    let loaded = await loadAppOptions();

    if (!loaded) {
      const legacy = readLegacyAppOptions();
      if (legacy) {
        loaded = legacy;
        await saveAppOptions(withDefaultAppOptions(legacy));
        localStorage.removeItem(LEGACY_PERSIST_KEY);
      }
    }

    mutations.hydrateAppOptions(loaded);
  } catch (err) {
    console.error('Failed to initialize app options', err);
  }
}
