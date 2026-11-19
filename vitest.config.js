import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { 'htmelf': fileURLToPath(new URL('./src/index.js', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    pool: 'forks',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
