import { defineConfig } from 'vite';
import * as path from 'path';
import dts from 'vite-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: path.join(__dirname, './src/index.ts'),
      name: 'media-devices',
      fileName: (format: string) => `media-devices.${format}.js`,
    },
  },
});
