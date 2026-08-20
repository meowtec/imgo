# Quality Calibration Benchmark

This directory contains the offline calibration script for aligning the public
`quality` value across lossy image encoders.

The script does two things:

1. Encodes each input image with `minifier-cli` release binary across the target
   formats and quality samples.
2. Decodes the original image to a PNG reference, decodes each encoded artifact
   back to PNG, compares both PNGs using SSIMULACRA2, and writes the score
   report as JSON.

File size is recorded for context only. It is not part of the quality score.

## Prerequisites

Build the release CLI:

```bash
cargo build -p minifier-cli --release
```

Install an SSIMULACRA2 command line tool and make sure it is available as
`ssimulacra2`, or pass its path with `--scorer`.

Current local path:

```bash
~/workspace/oss/ssimulacra2/build/ssimulacra2
```

The scorer must accept this call shape:

```bash
ssimulacra2 <reference-image> <distorted-image>
```

The script parses the last numeric value from stdout/stderr as the score.

## Usage

Put source images under `benchmark/images`, then run:

```bash
node benchmark/quality-calibration.mjs
```

Or pass one or more input files/directories:

```bash
node benchmark/quality-calibration.mjs \
  --input ./path/to/images \
  --output-dir benchmark/output \
  --report benchmark/output/report.json \
  --scorer ~/workspace/oss/ssimulacra2/build/ssimulacra2
```

Useful options:

```bash
node benchmark/quality-calibration.mjs --help
```

Defaults:

- Formats: `webp,heif,avif,jxl,jpg`
- Qualities: `0,1,2,5,10`, then every 5 through `100`
- CLI: `target/release/minifier-cli`
- Scorer: `ssimulacra2`

## Output

Artifacts are written under:

- `benchmark/output/encoded`: compressed images produced by `minifier-cli`
- `benchmark/output/reference`: PNG references decoded from original images
- `benchmark/output/decoded`: PNG images decoded from compressed artifacts for scoring

The JSON report contains:

- source image path
- PNG reference path
- format
- native quality value
- encoded artifact path
- decoded PNG path
- encoded byte size
- SSIMULACRA2 score
- per-variant error, when `--continue-on-error` is used
