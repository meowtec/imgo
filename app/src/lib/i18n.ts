import i18nResources from '@/i18n';

const DEFAULT_LANG_CODE: string = 'en';

function parseLangCode(raw: string) {
  return raw.split(/-|_/) as [string, string | undefined];
}

class I18n {
  private textMaps: Array<Record<string, string>>;

  constructor(
    private langTextMap: Record<string, Record<string, string>>,
    locale: string,
  ) {
    this.textMaps = [];
    this.setLocale(locale);
  }

  setLocale(locale: string) {
    const [lang] = parseLangCode(locale);

    const textMaps = [locale, lang, DEFAULT_LANG_CODE]
      .map((code) => this.langTextMap[code])
      .filter(Boolean);

    this.textMaps = textMaps;
  }

  text(key: string) {
    for (const map of this.textMaps) {
      if (map[key]) {
        return map[key];
      }
    }

    return key;
  }

  textTpl(key: string, params: string[]) {
    const text = this.text(key);
    return params.reduce((t, param, index) => t.replaceAll(`{${index}}`, param), text);
  }
}

export const i18n = new I18n(i18nResources, navigator.language);
