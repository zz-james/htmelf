// Prints how big the library is on its own: src/index.js bundled with Vite,
// with no demos. Run with `npm run size`. Builds into a temporary folder that
// is removed afterwards.
import { build } from 'vite';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(new URL('../src/index.js', import.meta.url));

async function bundle(minify) {
  const outDir = await mkdtemp(join(tmpdir(), 'htmelf-size-'));
  try {
    await build({
      logLevel: 'silent',
      configFile: false,
      build: {
        lib: { entry, formats: ['es'], fileName: 'htmelf' },
        outDir,
        emptyOutDir: true,
        minify,
      },
    });
    return await readFile(join(outDir, 'htmelf.js'));
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;
const row = (label, bytes) => console.log(`${label.padEnd(22)}${String(bytes).padStart(6)} B  ${kb(bytes).padStart(9)}`);

const bundled = await bundle(false);
const minified = await bundle(true);

console.log('htmelf (src/index.js, no demos)\n');
row('bundled', bundled.length);
row('minified', minified.length);
row('minified + gzip', gzipSync(minified).length);
row('minified + brotli', brotliCompressSync(minified).length);
