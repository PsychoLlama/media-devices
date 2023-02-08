import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.join(__dirname, './src/index.ts'),
      name: 'media-devices',
      fileName: 'media-devices',
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
});
