#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function parseArgs() {
  const args = process.argv.slice(2);
  let inputPaths = [];
  let outputDir = null;
  let deleteOriginal = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output-directory' || args[i] === '-o') {
      if (i + 1 < args.length) {
        outputDir = args[i + 1];
        i++; // Skip the next argument since we've used it
      } else {
        console.log('Error: --output-directory requires a path argument');
        process.exit(1);
      }
    } else if (args[i] === '--delete-original') {
      deleteOriginal = true;
    } else {
      inputPaths.push(args[i]);
    }
  }

  return { inputPaths, outputDir, deleteOriginal };
}

function extractMotionPhoto(
  filePath,
  outputDir = null,
  deleteOriginal = false
) {
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

      if (deleteOriginal) {
        console.log('\t\tDeleting original file...');
        fs.unlinkSync(filePath);
      }
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

function processFiles(pattern, outputDir, deleteOriginal) {
  const files = glob.sync(pattern);

  if (files.length === 0) {
    console.log('No matching files found.');
    return;
  }

  console.log(`Found ${files.length} files to process.`);
  files.forEach((file, index) => {
    console.log(`\nProcessing file ${index + 1} of ${files.length}`);
    if (fs.statSync(file).isFile() && /\.(jpg|jpeg)$/i.test(file)) {
      extractMotionPhoto(file, outputDir, deleteOriginal);
    } else {
      console.log(`Skipping ${file} - not a valid JPEG file`);
    }
  });
}

function main() {
  const { inputPaths, outputDir, deleteOriginal } = parseArgs();

  if (inputPaths.length === 0) {
    console.log(
      'Usage: pixel-motion-picture-exporter <path_to_motion_photo(s)> [--output-directory <path>] [--delete-original]'
    );
    console.log('Options:');
    console.log(
      '  --output-directory, -o  Specify output directory for extracted files'
    );
    console.log(
      '  --delete-original       Delete original file after successful extraction'
    );
    console.log(
      '\nYou can use glob patterns like *.jpg to process multiple files'
    );
    process.exit(1);
  }

  console.log('Processing motion photo(s)...');

  // Process each input path
  inputPaths.forEach((inputPath) => {
    // Check if the path contains glob patterns
    if (
      inputPath.includes('*') ||
      inputPath.includes('?') ||
      inputPath.includes('[')
    ) {
      processFiles(inputPath, outputDir, deleteOriginal);
    } else {
      // Single file case
      if (
        fs.existsSync(inputPath) &&
        fs.statSync(inputPath).isFile() &&
        /\.(jpg|jpeg)$/i.test(inputPath)
      ) {
        extractMotionPhoto(inputPath, outputDir, deleteOriginal);
      } else {
        console.log(`Skipping ${inputPath} - not a valid JPEG file`);
      }
    }
  });

  console.log('\nDone.');
}

main();
