// Try to load sharp, but make it optional
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('Sharp not available, image processing will be skipped:', err.message);
}

// Process image: optimize and create thumbnail
async function processImage(buffer, options = {}) {
  // Skip processing if sharp is not available
  if (!sharp) {
    console.log('Image processing skipped (sharp not available)');
    return buffer;
  }

  try {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
      format = 'jpeg'
    } = options;

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Resize if needed
    let processed = sharp(buffer);

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      processed = processed.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert and compress
    if (format === 'jpeg') {
      processed = processed.jpeg({ quality });
    } else if (format === 'png') {
      processed = processed.png({ quality });
    } else if (format === 'webp') {
      processed = processed.webp({ quality });
    }

    const outputBuffer = await processed.toBuffer();

    return {
      buffer: outputBuffer,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length
      }
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

// Create thumbnail
async function createThumbnail(buffer, width = 300, height = 300) {
  try {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw new Error('Failed to create thumbnail');
  }
}

// Process screenshot (compress and optimize)
async function processScreenshot(buffer) {
  try {
    return await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (error) {
    console.error('Screenshot processing error:', error);
    throw new Error('Failed to process screenshot');
  }
}

module.exports = {
  processImage,
  createThumbnail,
  processScreenshot
};
