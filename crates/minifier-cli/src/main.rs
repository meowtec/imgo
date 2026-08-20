use std::{fs, path};

use clap::Parser;
use minifier::OptimizeOptions;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  #[arg(short, long)]
  input: String,

  #[arg(short, long)]
  output: Option<String>,

  #[arg(short, long, default_value_t = 75)]
  quality: u8,

  #[arg(long, default_value_t = false)]
  lossless: bool,

  #[arg(long)]
  speed: Option<u8>,

  // #[arg(long, default_value_t = false)]
  // r#override: bool,
  #[arg(long)]
  preserve_metadata: Option<bool>,

  #[arg(long, default_value_t = false)]
  verbose: bool,
}

fn build_options(args: &Args) -> OptimizeOptions {
  OptimizeOptions {
    quality: args.quality,
    lossless: Some(args.lossless),
    speed: args.speed,
    preserve_metadata: args.preserve_metadata,
    ..Default::default()
  }
}

fn optimize_image_file(
  input_path: &str,
  output_path: &str,
  options: OptimizeOptions,
) -> anyhow::Result<()> {
  let file = fs::read(input_path)?;

  let output_format = path::Path::new(output_path)
    .extension()
    .and_then(minifier::ImageFormat::detect_from_extension);

  let output = minifier::optimize_image(
    &file,
    output_format,
    Some(options),
    None,
  )?;

  fs::write(output_path, output.data)?;

  Ok(())
}

fn setup_logger(verbose: bool) {
  if verbose {
    env_logger::Builder::new()
      .filter_level(log::LevelFilter::max())
      .init();
  } else {
    env_logger::init();
  }
}

fn main() -> anyhow::Result<()> {
  let args = Args::parse();
  let options = build_options(&args);

  setup_logger(args.verbose);

  optimize_image_file(
    &args.input,
    &args.output.unwrap_or_else(|| args.input.clone()),
    options,
  )?;

  Ok(())
}
