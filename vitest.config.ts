import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.test.js']
  },
  resolve: {
    alias: {
      '@': './src',
      'supertest': path.resolve(__dirname, './node_modules/supertest'),
      'uuid': path.resolve(__dirname, './node_modules/uuid')
    }
  }
});