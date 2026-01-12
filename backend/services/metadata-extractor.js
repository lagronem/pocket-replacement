const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const fileStorage = require('./file-storage');
const db = require('../config/database');

// Extract metadata from a URL
async function extractMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract basic metadata with fallbacks
    const metadata = {
      title: getTitle(document, url),
      excerpt: getExcerpt(document),
      author: getAuthor(document),
      publishedDate: getPublishedDate(document),
      domain: new URL(url).hostname,
      faviconUrl: getFaviconUrl(document, url)
    };

    // Use Readability to extract article content
    try {
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        metadata.content = article.textContent;
        metadata.excerpt = metadata.excerpt || article.excerpt;
        metadata.wordCount = countWords(article.textContent);
        metadata.readingTimeMinutes = Math.ceil(metadata.wordCount / 200);
      }
    } catch (err) {
      console.error('Readability extraction failed:', err);
    }

    // Download and save favicon
    if (metadata.faviconUrl) {
      try {
        metadata.faviconPath = await downloadFavicon(metadata.faviconUrl, metadata.domain);
      } catch (err) {
        console.error('Favicon download failed:', err);
      }
    }

    return metadata;
  } catch (error) {
    console.error('Metadata extraction error:', error);
    throw error;
  }
}

// Get page title with multiple fallbacks
function getTitle(document, url) {
  // Try Open Graph
  let title = document.querySelector('meta[property="og:title"]')?.content;

  // Try Twitter Card
  if (!title) {
    title = document.querySelector('meta[name="twitter:title"]')?.content;
  }

  // Try standard title tag
  if (!title) {
    title = document.querySelector('title')?.textContent;
  }

  // Try first h1
  if (!title) {
    title = document.querySelector('h1')?.textContent;
  }

  // Fallback to URL
  if (!title) {
    title = new URL(url).hostname;
  }

  return title.trim();
}

// Get page excerpt/description
function getExcerpt(document) {
  // Try Open Graph
  let excerpt = document.querySelector('meta[property="og:description"]')?.content;

  // Try Twitter Card
  if (!excerpt) {
    excerpt = document.querySelector('meta[name="twitter:description"]')?.content;
  }

  // Try standard description
  if (!excerpt) {
    excerpt = document.querySelector('meta[name="description"]')?.content;
  }

  // Try first paragraph
  if (!excerpt) {
    const firstP = document.querySelector('article p, main p, p');
    excerpt = firstP?.textContent?.substring(0, 300);
  }

  return excerpt ? excerpt.trim().substring(0, 500) : null;
}

// Get author
function getAuthor(document) {
  let author = document.querySelector('meta[name="author"]')?.content;

  if (!author) {
    author = document.querySelector('meta[property="article:author"]')?.content;
  }

  if (!author) {
    author = document.querySelector('[rel="author"]')?.textContent;
  }

  return author ? author.trim() : null;
}

// Get published date
function getPublishedDate(document) {
  let date = document.querySelector('meta[property="article:published_time"]')?.content;

  if (!date) {
    date = document.querySelector('meta[name="publish-date"]')?.content;
  }

  if (!date) {
    date = document.querySelector('time[datetime]')?.getAttribute('datetime');
  }

  return date || null;
}

// Get favicon URL
function getFaviconUrl(document, pageUrl) {
  // Try to find favicon link
  let faviconUrl = document.querySelector('link[rel="icon"]')?.href ||
                   document.querySelector('link[rel="shortcut icon"]')?.href ||
                   document.querySelector('link[rel="apple-touch-icon"]')?.href;

  // Fallback to /favicon.ico
  if (!faviconUrl) {
    const urlObj = new URL(pageUrl);
    faviconUrl = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
  }

  // Make absolute URL
  if (faviconUrl && !faviconUrl.startsWith('http')) {
    faviconUrl = new URL(faviconUrl, pageUrl).href;
  }

  return faviconUrl;
}

// Download and save favicon
async function downloadFavicon(faviconUrl, domain) {
  try {
    const response = await fetch(faviconUrl);

    if (!response.ok) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = faviconUrl.endsWith('.png') ? '.png' :
                faviconUrl.endsWith('.svg') ? '.svg' : '.ico';

    const filename = `${domain.replace(/\./g, '_')}${ext}`;
    const filePath = await fileStorage.saveFile(buffer, filename, 'favicon');

    return filePath;
  } catch (error) {
    console.error('Error downloading favicon:', error);
    return null;
  }
}

// Count words in text
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

// Save URL metadata to database
async function saveUrlMetadata(itemId, metadata) {
  await db.runAsync(`
    INSERT INTO url_metadata (item_id, domain, author, published_date, word_count, reading_time_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    itemId,
    metadata.domain,
    metadata.author || null,
    metadata.publishedDate || null,
    metadata.wordCount || null,
    metadata.readingTimeMinutes || null
  ]);
}

module.exports = {
  extractMetadata,
  saveUrlMetadata
};
