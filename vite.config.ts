import { defineConfig } from 'vite';
import * as path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: 'tsconfig.build.json',
    }),
  ],
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
