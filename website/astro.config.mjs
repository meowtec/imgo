// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import wasm from 'vite-plugin-wasm';
import icon from 'astro-icon';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '../app');
const mountAppEntry = path.resolve(__dirname, './src/scripts/mount-app.ts');

// https://astro.build/config
export default defineConfig({
  site: 'https://imgo.app',
  integrations: [icon()],
  vite: {
    plugins: [
      viteReact({
        include: [/\.tsx?$/, /\.jsx?$/],
        jsxImportSource: '@emotion/react',
        // fastRefresh: false,
        // babel: {
        //   plugins: ['@emotion/babel-plugin'],
        // },
      }),
      tailwindcss(),
      wasm(),
      createSvgSpritePlugin({
        symbolId: 'icon-[name]',
        include: '**/assets/icons/*.svg',
        exportType: 'react',
      }),
    ],
    define: {
      RUNTIME: JSON.stringify('web'),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: [
        {
          find: '@/platform',
          replacement: path.resolve(appDir, './src/platform/web/index.ts'),
        },
        {
          find: '@/gen-types',
          replacement: path.resolve(appDir, './src-tauri/bindings'),
        },
        {
          find: '@',
          replacement: path.resolve(appDir, './src'),
        },
      ],
    },
    server: {
      fs: {
        allow: ['..'],
      },
      hmr: false,
      warmup: {
        clientFiles: [mountAppEntry, './src/pages/online/index.astro'],
      },
    },
    optimizeDeps: {
      entries: [mountAppEntry],
      holdUntilCrawlEnd: true,
      include: ['react', 'react/jsx-runtime', 'react-dom/client', '@emotion/react'],
      exclude: ['@imgo/minifier-js'],
    },
  },
});
