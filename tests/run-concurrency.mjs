import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const outfile = path.resolve('tests/.concurrency-build.mjs');
await build({ entryPoints: [path.resolve('tests/concurrency.test.mjs')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'silent', packages: 'external' });
try { await import(pathToFileURL(outfile).href); } finally { fs.rmSync(outfile, { force: true }); }