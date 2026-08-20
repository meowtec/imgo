import { readFileSync, writeFileSync } from 'node:fs';
import parseArgv from 'minimist';
import { initWasmModule } from './js-src/wrapper.js';

const args = parseArgv(process.argv.slice(2));

if (args._.length < 2) {
  console.error('error: no input / output files');
  console.log(['example:', '  npm run cli input.png output.heif'].join('\n'));
  process.exit(1);
}

initWasmModule()
  .then((mod) => {
    const [input, output] = args._;
    const source = readFileSync(input);
    const targetFormat = mod.getFormatFromPath(output);

    const result = mod.minify(source, targetFormat, {
      indexed: false,
      quality: args.q || 75,
      lossless: Boolean(args.lossless),
      speed: args.speed ?? null,
    });

    writeFileSync(output, result.data);
  })
  .catch((err) => {
    console.log('failed:', err);
  });
