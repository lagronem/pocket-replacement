const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Use /tmp for production or local data directory for development
const FILES_BASE_PATH = process.env.NODE_ENV === 'production'
  ? '/tmp/files'
  : path.join(__dirname, '../../data/files');

// Ensure all file directories exist
function ensureDirectories() {
  const dirs = [
    path.join(FILES_BASE_PATH, 'pdfs'),
    path.join(FILES_BASE_PATH, 'images'),
    path.join(FILES_BASE_PATH, 'screenshots'),
    path.join(FILES_BASE_PATH, 'favicons')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Sanitize filename to remove dangerous characters
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

// Generate unique filename with timestamp
function generateFilename(originalName, prefix = '') {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalName);
  const hash = crypto.createHash('md5').update(`${timestamp}${sanitized}`).digest('hex').substring(0, 8);
  return `${timestamp}_${hash}_${sanitized}`;
}

// Save file to appropriate directory
async function saveFile(buffer, filename, type) {
  ensureDirectories();

  let subdir;
  switch (type) {
    case 'pdf':
      subdir = 'pdfs';
      break;
    case 'image':
      subdir = 'images';
      break;
    case 'screenshot':
      subdir = 'screenshots';
      break;
    case 'favicon':
      subdir = 'favicons';
      break;
    default:
      throw new Error(`Unknown file type: ${type}`);
  }

  const uniqueFilename = generateFilename(filename);
  const filePath = path.join(FILES_BASE_PATH, subdir, uniqueFilename);
  const relativePath = path.join('files', subdir, uniqueFilename);

  await fs.promises.writeFile(filePath, buffer);

  return relativePath;
}

// Read file from storage
async function readFile(relativePath) {
  const filePath = path.join(__dirname, '../../data', relativePath);

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  return await fs.promises.readFile(filePath);
}

// Delete file from storage
async function deleteFile(relativePath) {
  if (!relativePath) return;

  const filePath = path.join(__dirname, '../../data', relativePath);

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

// Get file extension from filename
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

// Get MIME type from extension
function getMimeType(filename) {
  const ext = getFileExtension(filename);
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  ensureDirectories,
  sanitizeFilename,
  generateFilename,
  saveFile,
  readFile,
  deleteFile,
  getFileExtension,
  getMimeType
};
