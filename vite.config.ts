import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'strip-raw-root-gh-pages-redirect',
        transformIndexHtml(html) {
          if (command === 'build') {
            return html.replace(
              /<!-- GH_PAGES_RAW_ROOT_REDIRECT_START -->[\s\S]*?<!-- GH_PAGES_RAW_ROOT_REDIRECT_END -->/,
              ''
            );
          }
          return html;
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
