#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output-directory' || args[i] === '-o') {
      if (i + 1 < args.length) {
        outputDir = args[i + 1];
        i++; // Skip the next argument since we've used it
      } else {
        console.log('Error: --output-directory requires a path argument');
        process.exit(1);
      }
    } else if (!inputPath) {
      inputPath = args[i];
    }
  }

  return { inputPath, outputDir };
}

function extractMotionPhoto(filePath, outputDir = null) {
  console.log(`\tProcessing: ${filePath}`);

  const fileSize = fs.statSync(filePath).size;
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
  console.log(`\t\tFile size: ${fileSizeMB} MB`);

  const data = fs.readFileSync(filePath);

  // MP4 data starts 4 bytes before "ftyp"
  const mp4StartPos = data.indexOf('ftyp');

  if (mp4StartPos !== -1) {
    const actualMp4Start = mp4StartPos - 4;

    // JPEG files end with FF D9 in hex
    const jpgData = data.subarray(0, actualMp4Start);
    const jpgEndPos = findLastSequence(jpgData, Buffer.from([0xff, 0xd9]));

    if (jpgEndPos !== -1) {
      // accounting for the length of FFD9
      const actualJpgEnd = jpgEndPos + 2;

      // If outputDir is specified, use it; otherwise use the input file's directory
      const baseDir = outputDir || path.dirname(filePath);

      // Create output directory if it doesn't exist
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      const outputBase = path.join(baseDir, path.parse(filePath).name);

      console.log('\t\tSaving photo...');
      const photoPath = `${outputBase}_photo.jpg`;
      fs.writeFileSync(photoPath, data.subarray(0, actualJpgEnd));

      console.log('\t\tSaving video...');
      const videoPath = `${outputBase}_video.mp4`;
      fs.writeFileSync(videoPath, data.subarray(actualMp4Start));

      console.log(
        `\t\tExtracted files saved as: ${photoPath} and ${videoPath}`
      );
    } else {
      console.log(
        '\t\tSKIPPING - File appears to contain an MP4 but no valid JPG EOI segment could be found.'
      );
    }
  } else {
    console.log(
      '\t\tSKIPPING - File does not appear to be a Google motion photo.'
    );
  }
}

function findLastSequence(buffer, sequence) {
  for (let i = buffer.length - sequence.length; i >= 0; i--) {
    let found = true;
    for (let j = 0; j < sequence.length; j++) {
      if (buffer[i + j] !== sequence[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function main() {
  const { inputPath, outputDir } = parseArgs();

  if (!inputPath) {
    console.log(
      'Usage: pixel-motion-picture-exporter <path_to_motion_photo> [--output-directory <path>]'
    );
    console.log('Options:');
    console.log(
      '  --output-directory, -o  Specify output directory for extracted files'
    );
    process.exit(1);
  }

  console.log('Processing motion photo...');
  if (
    fs.existsSync(inputPath) &&
    fs.statSync(inputPath).isFile() &&
    /\.(jpg|jpeg)$/i.test(inputPath)
  ) {
    extractMotionPhoto(inputPath, outputDir);
  } else {
    console.log(`Error: ${inputPath} is not a valid JPEG file`);
  }

  console.log('Done.');
}

main();
