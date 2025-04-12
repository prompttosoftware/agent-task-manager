import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.test.js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nestjs/testing': '@nestjs/testing',
    },
    extensions: ['.ts', '.js']
  }
});