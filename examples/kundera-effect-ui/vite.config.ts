import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      fs: fileURLToPath(new URL('./src/shims/node-fs.ts', import.meta.url)),
      'node:fs': fileURLToPath(new URL('./src/shims/node-fs.ts', import.meta.url)),
      path: fileURLToPath(new URL('./src/shims/node-path.ts', import.meta.url)),
      'node:path': fileURLToPath(new URL('./src/shims/node-path.ts', import.meta.url)),
      url: fileURLToPath(new URL('./src/shims/node-url.ts', import.meta.url)),
      'node:url': fileURLToPath(new URL('./src/shims/node-url.ts', import.meta.url)),
    },
  },
});
