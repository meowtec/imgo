import { useStore } from '@/store';
import type { AppTheme } from '@/types';

export function subscribeAppTheme(forcedTheme?: AppTheme) {
  const matchDark = window.matchMedia('(prefers-color-scheme: dark)');

  const isDarkTheme = (appTheme: AppTheme) => {
    switch (appTheme) {
      case 'dark':
        return true;
      case 'light':
        return false;
      default:
        return matchDark.matches;
    }
  };

  const applyTheme = () => {
    const appTheme = forcedTheme ?? useStore.getState().appOptions.appTheme;
    const isDark = isDarkTheme(appTheme);

    const classList = document.documentElement.classList;
    classList.remove('dark');
    if (isDark) {
      classList.add('dark');
    }
  };

  if (forcedTheme == null) {
    useStore.subscribe((state) => state.appOptions.appTheme, applyTheme);
    matchDark.addEventListener('change', applyTheme);
  }

  applyTheme();
}
