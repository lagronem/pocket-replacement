const pdfParse = require('pdf-parse');

// Extract text and metadata from PDF buffer
async function processPdf(buffer) {
  try {
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: countWords(data.text),
      info: data.info
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF');
  }
}

// Count words in text
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

module.exports = {
  processPdf
};
