import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import wasm from 'vite-plugin-wasm';
import { watchI18n } from './scripts/i18n-gen.ts';

const RUNTIME = process.env.RUNTIME ?? 'tauri';
const APP_BASE = process.env.APP_BASE ?? '/online/';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  if (command === 'serve') {
    watchI18n();
  }

  return {
    base: RUNTIME === 'web' ? APP_BASE : './',
    plugins: [
      react(),
      wasm(),
      createSvgSpritePlugin({
        symbolId: 'icon-[name]',
        include: '**/assets/icons/*.svg',
        exportType: 'react',
      }),
    ],
    define: {
      RUNTIME: JSON.stringify(RUNTIME),
    },
    resolve: {
      alias: {
        '@/gen-types': path.resolve(import.meta.dirname, './src-tauri/bindings'),
        '@/platform': path.resolve(
          import.meta.dirname,
          RUNTIME === 'web' ? './src/platform/web/index.ts' : './src/platform/tauri/index.ts',
        ),
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: RUNTIME === 'web' ? 12316 : 12315,
      // host: '0.0.0.0',
    },
  };
});
