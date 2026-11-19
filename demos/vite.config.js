import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));

export default {
  root: here,
  resolve: { alias: { 'htmelf': resolve(here, '../src/index.js') } },
  build: {
    outDir: resolve(here, '../dist-demos'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(here, 'index.html'),
        todo: resolve(here, 'todo/index.html'),
        kanban: resolve(here, 'kanban/index.html'),
        stopwatch: resolve(here, 'stopwatch/index.html'),
      },
    },
  },
};
