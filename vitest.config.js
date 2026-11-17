import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    pool: 'forks',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
