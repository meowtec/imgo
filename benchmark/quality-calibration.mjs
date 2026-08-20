import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const DEFAULT_FORMATS = [
  { name: 'webp', extension: 'webp' },
  { name: 'heif', extension: 'heic' },
  { name: 'avif', extension: 'avif' },
  { name: 'jxl', extension: 'jxl' },
  { name: 'jpg', extension: 'jpg' },
];

const DEFAULT_QUALITIES = [
  0, 1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];
const INPUT_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.heic',
  '.heif',
  '.jpeg',
  '.jpg',
  '.jxl',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
]);

function printHelp() {
  console.log(`
Usage:
  node benchmark/quality-calibration.mjs --input <file-or-dir> [--input <file-or-dir> ...]

Options:
  --input <path>            Input image file or directory. Can be repeated.
  --output-dir <path>       Output artifact directory. Default: benchmark/output
  --report <path>           JSON report path. Default: benchmark/output/report.json
  --cli <path>              minifier-cli release binary. Default: target/release/minifier-cli
  --scorer <path>           SSIMULACRA2 binary name or path. Default: ssimulacra2
  --formats <list>          Comma-separated formats. Default: webp,heif,avif,jxl,jpg
  --qualities <list>        Comma-separated qualities. Default: 0,1,2,5,10, then every 5 through 100
  --build-cli               Run cargo build -p minifier-cli --release before encoding.
  --continue-on-error       Keep running and record variant errors in the report.
  --help                    Show this message.

Scoring:
  The scorer must accept: <reference-image> <distorted-image>
  The script parses the last numeric value from stdout/stderr as the score.
`);
}

function parseArgs(argv) {
  const args = {
    input: [],
    outputDir: resolve(rootDir, 'benchmark/output'),
    report: resolve(rootDir, 'benchmark/output/report.json'),
    cli: resolve(
      rootDir,
      process.platform === 'win32'
        ? 'target/release/minifier-cli.exe'
        : 'target/release/minifier-cli',
    ),
    scorer: 'ssimulacra2',
    formats: DEFAULT_FORMATS.map((format) => format.name),
    qualities: DEFAULT_QUALITIES,
    buildCli: false,
    continueOnError: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) {
        throw new Error(`Missing value for ${arg}`);
      }
      return argv[i];
    };

    switch (arg) {
      case '--input':
      case '-i':
        args.input.push(resolve(rootDir, next()));
        break;
      case '--output-dir':
        args.outputDir = resolve(rootDir, next());
        break;
      case '--report':
        args.report = resolve(rootDir, next());
        break;
      case '--cli':
        args.cli = resolve(rootDir, next());
        break;
      case '--scorer':
        args.scorer = next();
        break;
      case '--formats':
        args.formats = next()
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        break;
      case '--qualities':
        args.qualities = next()
          .split(',')
          .map((value) => Number.parseInt(value, 10))
          .filter((value) => Number.isInteger(value));
        break;
      case '--build-cli':
        args.buildCli = true;
        break;
      case '--continue-on-error':
        args.continueOnError = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        args.input.push(resolve(rootDir, arg));
    }
  }

  if (args.input.length === 0) {
    args.input.push(resolve(rootDir, 'benchmark/images'));
  }

  if (args.qualities.some((quality) => quality < 0 || quality > 100)) {
    throw new Error('Quality values must be in the 0..100 range');
  }

  return args;
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      reject(
        new Error(`${command} ${args.join(' ')} exited with code ${code}\n${stderr || stdout}`),
      );
    });
  });
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function collectImages(paths) {
  const images = [];

  async function visit(path) {
    let info;
    try {
      info = await stat(path);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return;
      }
      throw error;
    }

    if (info.isDirectory()) {
      const entries = await readdir(path);
      for (const entry of entries) {
        await visit(resolve(path, entry));
      }
      return;
    }

    if (info.isFile() && INPUT_EXTENSIONS.has(extname(path).toLowerCase())) {
      images.push(path);
    }
  }

  for (const path of paths) {
    await visit(path);
  }

  return [...new Set(images)].sort();
}

function resolveFormats(formatNames) {
  const map = new Map(DEFAULT_FORMATS.map((format) => [format.name, format]));
  return formatNames.map((name) => {
    const format = map.get(name);
    if (format == null) {
      throw new Error(
        `Unsupported format "${name}". Supported formats: ${DEFAULT_FORMATS.map((item) => item.name).join(', ')}`,
      );
    }
    return format;
  });
}

function artifactName(inputPath, format, quality, extension) {
  const stem = basename(inputPath, extname(inputPath)).replace(/[^a-zA-Z0-9._-]/g, '_');
  const hash = createHash('sha1').update(inputPath).digest('hex').slice(0, 8);
  return `${stem}-${hash}-${format}-q${String(quality).padStart(3, '0')}.${extension}`;
}

function referenceName(inputPath) {
  const stem = basename(inputPath, extname(inputPath)).replace(/[^a-zA-Z0-9._-]/g, '_');
  const hash = createHash('sha1').update(inputPath).digest('hex').slice(0, 8);
  return `${stem}-${hash}-reference.png`;
}

function parseScore(output) {
  const lines = output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?$/iu.test(line)) {
      return Number.parseFloat(line);
    }
  }

  const lastLine = lines.at(-1) ?? '';
  const matches = lastLine.match(/[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?/giu);
  if (matches == null || matches.length === 0) {
    throw new Error(`Unable to parse score from scorer output: ${output.trim()}`);
  }
  return Number.parseFloat(matches[matches.length - 1]);
}

async function encodeImage(cli, inputPath, outputPath, quality) {
  await mkdir(dirname(outputPath), { recursive: true });
  await run(cli, ['--input', inputPath, '--output', outputPath, '--quality', String(quality)]);
}

async function decodeToPng(cli, inputPath, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await run(cli, ['--input', inputPath, '--output', outputPath, '--quality', '100']);
}

async function scoreImage(scorer, referencePath, distortedPath) {
  const { stdout, stderr } = await run(scorer, [referencePath, distortedPath]);
  const rawOutput = `${stdout}\n${stderr}`.trim();
  return {
    metric: 'ssimulacra2',
    value: parseScore(rawOutput),
    rawOutput,
    higherIsBetter: true,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const formats = resolveFormats(args.formats);

  if (args.buildCli) {
    console.log('Building minifier-cli release binary...');
    await run('cargo', ['build', '-p', 'minifier-cli', '--release'], { stdio: 'inherit' });
  }

  if (!(await pathExists(args.cli))) {
    throw new Error(
      `minifier-cli release binary not found: ${args.cli}\nRun: cargo build -p minifier-cli --release`,
    );
  }

  const images = await collectImages(args.input);
  if (images.length === 0) {
    throw new Error(
      `No input images found. Add images under ${args.input.join(', ')} or pass --input.`,
    );
  }

  await mkdir(args.outputDir, { recursive: true });
  await mkdir(dirname(args.report), { recursive: true });

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    rootDir,
    cli: args.cli,
    scorer: args.scorer,
    scoringModel: {
      name: 'SSIMULACRA2',
      mode: 'full-reference',
      higherIsBetter: true,
      note: 'Scores compare the PNG reference decoded from the original image with the decoded PNG produced from each encoded artifact. File size is recorded but not used for quality scoring.',
    },
    formats: formats.map((format) => format.name),
    qualities: args.qualities,
    images: [],
  };

  for (const imagePath of images) {
    console.log(`Processing ${relative(rootDir, imagePath)}`);
    const referencePath = resolve(args.outputDir, 'reference', referenceName(imagePath));
    await decodeToPng(args.cli, imagePath, referencePath);

    const imageReport = {
      source: imagePath,
      referencePath,
      variants: [],
    };

    for (const format of formats) {
      for (const quality of args.qualities) {
        const encodedPath = resolve(
          args.outputDir,
          'encoded',
          artifactName(imagePath, format.name, quality, format.extension),
        );
        const decodedPath = resolve(
          args.outputDir,
          'decoded',
          artifactName(imagePath, format.name, quality, 'png'),
        );
        const variant = {
          format: format.name,
          quality,
          encodedPath,
          decodedPath,
        };

        try {
          await encodeImage(args.cli, imagePath, encodedPath, quality);
          await decodeToPng(args.cli, encodedPath, decodedPath);

          const encodedInfo = await stat(encodedPath);
          variant.encodedBytes = encodedInfo.size;
          variant.score = await scoreImage(args.scorer, referencePath, decodedPath);
          console.log(`  ${format.name} q${quality}: ${variant.score.value}`);
        } catch (error) {
          variant.error = error instanceof Error ? error.message : String(error);
          console.error(`  ${format.name} q${quality} failed: ${variant.error}`);
          if (!args.continueOnError) {
            imageReport.variants.push(variant);
            report.images.push(imageReport);
            await writeFile(args.report, `${JSON.stringify(report, null, 2)}\n`);
            throw error;
          }
        }

        imageReport.variants.push(variant);
      }
    }

    report.images.push(imageReport);
  }

  await writeFile(args.report, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Report written to ${isAbsolute(args.report) ? args.report : resolve(rootDir, args.report)}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
