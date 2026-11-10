import { build, transform } from 'esbuild';
import { mkdir, rm, readFile, writeFile, copyFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await build({
  entryPoints: ['worker/index.js'], outfile: 'dist/server/index.js', bundle: true,
  format: 'esm', platform: 'browser', target: 'es2022', minify: true,
  plugins: [{ name: 'text-assets', setup(builder) {
    builder.onLoad({ filter: /public\/(app\.js|styles\.css|index\.html)$/ }, async args => {
      let contents = await readFile(args.path, 'utf8');
      if (!args.path.endsWith('.html')) contents = (await transform(contents, { loader: args.path.endsWith('.css') ? 'css' : 'js', minify: true, target: 'es2022' })).code;
      return { contents, loader: 'text' };
    });
  } }],
});
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
await writeFile('dist/package.json', '{"type":"module"}\n');
console.info('Built Sites Worker with embedded static assets.');
