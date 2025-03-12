// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'json-summary', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/test/**'],
    },
  },
});