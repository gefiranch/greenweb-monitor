import { build, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, rm, readFile, writeFile, copyFile } from 'node:fs/promises';
import { basename } from 'node:path';

const assets = new Map();
for (const [name, loader] of [['styles.css', 'css'], ['app.js', 'js']]) {
  const source = await readFile(`public/${name}`, 'utf8');
  assets.set(name, (await transform(source, { loader, minify: true, target: 'es2022' })).code);
}
let html = await readFile('public/index.html', 'utf8');
for (const [name, content] of assets) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  html = html.replace(new RegExp(`/${name.replace('.', '\\.')}\\?v=[^"\\s]+`), `/${name}?v=${hash}`);
}
assets.set('index.html', html.replace(/>\s+</g, '><').trim());
await rm('dist', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await build({
  entryPoints: ['worker/index.js'], outfile: 'dist/server/index.js', bundle: true,
  format: 'esm', platform: 'browser', target: 'es2022', minify: true,
  plugins: [{ name: 'text-assets', setup(builder) {
    builder.onLoad({ filter: /public\/(app\.js|styles\.css|index\.html)$/ }, args => ({ contents: assets.get(basename(args.path)), loader: 'text' }));
  } }],
});
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
await writeFile('dist/package.json', '{"type":"module"}\n');
console.info('Built Sites Worker with versioned, embedded static assets.');
