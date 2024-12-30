# `pixel-motion-picture-exporter`

CLI tool to extract photo and video from Google Pixel [Top Shot Photos](https://support.google.com/pixelcamera/answer/9937175?hl=en).

Normally, the only way to get a video out of Top Shot is to use the Google Photos app to manually export each such photo as video. This tool allows you to do it for multiple such photos at once, using the file saved in your `DCIM/Camera` directory.

## Installation

You can use this tool directly with npx:

```bash
npx pixel-motion-picture-exporter <path-to-motion-photo>
```

Or install it globally:

```bash
npm install -g pixel-motion-picture-exporter
pixel-motion-picture-exporter <path-to-motion-photo>
```

## Usage

```bash
pixel-motion-picture-exporter <path-to-motion-photo> [--output-directory <path>] [--delete-original]
```

### Options

- `--output-directory`, `-o`: Specify a custom output directory for the extracted files
- `--delete-original`: Delete the original motion photo file after successful extraction (default: false)

### Examples

1. Extract files to the same directory as the input file:

```bash
pixel-motion-picture-exporter ./MOTION_PHOTO.MP.jpg
```

2. Extract all files in the current directory:

```bash
pixel-motion-picture-exporter ./*.MP.jpg
```

3. Extract files to a specific directory:

```bash
pixel-motion-picture-exporter ./MOTION_PHOTO.MP.jpg --output-directory ./extracted
# or
pixel-motion-picture-exporter ./MOTION_PHOTO.MP.jpg -o ./extracted
```

4. Extract files and delete the original:

```bash
pixel-motion-picture-exporter ./MOTION_PHOTO.MP.jpg --delete-original
```

### Output

The tool will create two files:

- `{original_name}_photo.jpg`: The still photo
- `{original_name}_video.mp4`: The motion video

## Notes

- The input file must be a JPEG file (`.jpg` or `.jpeg` extension)
- If the specified output directory doesn't exist, it will be created automatically
- The tool will preserve the original filename (minus the extension) and append `_photo` and `_video` for the respective outputs
