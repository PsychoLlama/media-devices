import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-utils/index.ts'],
    coverage: {
      include: ['src'],
    },
    exclude: [...configDefaults.exclude, '.direnv/**'],
  },
});
