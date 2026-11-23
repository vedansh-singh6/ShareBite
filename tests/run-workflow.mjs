// Bundles the workflow test (and the service layer it imports) with esbuild,
// then runs it under Node. This resolves Vite-style extensionless imports.
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Output inside the project so Node can resolve external packages (axios).
const outfile = path.resolve('tests/.workflow-build.mjs');

await build({
  entryPoints: [path.resolve('tests/workflow.test.mjs')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  logLevel: 'silent',
  packages: 'external',
});

try {
  await import(pathToFileURL(outfile).href);
} finally {
  fs.rmSync(outfile, { force: true });
}