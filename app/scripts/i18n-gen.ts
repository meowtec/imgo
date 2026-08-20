import path from 'node:path';
import fs from 'node:fs';
import dedent from 'dedent';

function generateI18n() {
  const record: Record<string, Record<string, string>> = {};
  const I18N_DIR = './src-tauri/i18n';
  const I18N_DIST_JS = './src/i18n.js';
  const I18N_DIST_DTS = './src/i18n.d.ts';
  const keys = new Set<string>();

  for (const file of fs.readdirSync(I18N_DIR)) {
    if (file.endsWith('.json')) {
      const texts = JSON.parse(fs.readFileSync(path.join(I18N_DIR, file), 'utf-8'));

      Object.keys(texts).forEach((key) => keys.add(key));
      record[file.replace('.json', '')] = texts;
    }
  }

  fs.writeFileSync(
    I18N_DIST_DTS,
    dedent`
      // Auto-generated, DO NOT MODIFY!
      /* eslint-disable  */
      const defaults: Record<string, Record<${Array.from(keys)
        .map((key) => `'${key}'`)
        .join(' | ')}, string>>;
      export default defaults;
    `,
  );

  fs.writeFileSync(
    I18N_DIST_JS,
    dedent`
      // Auto-generated, DO NOT MODIFY!
      /* eslint-disable  */
      export default JSON.parse(${JSON.stringify(JSON.stringify(record))});
    `,
  );

  return record;
}

export function watchI18n() {
  const I18N_DIR = './src-tauri/i18n';
  fs.watch(I18N_DIR, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
      generateI18n();
    }
  });
}

generateI18n();
