import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: configDirectory,
  envDir: path.resolve(configDirectory, '..'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(configDirectory, '..'),
    },
  },
  build: {
    outDir: path.resolve(configDirectory, '..', 'dist-admin'),
    emptyOutDir: true,
  },
});
