// Content script for page content extraction
// This script runs in the context of web pages

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    const content = extractPageContent();
    sendResponse(content);
  }
  return true;
});

// Extract page content and metadata
function extractPageContent() {
  const getMetaContent = (name, property) => {
    let meta = document.querySelector(`meta[name="${name}"]`) ||
                document.querySelector(`meta[property="${property}"]`);
    return meta ? meta.content : null;
  };

  // Get selected text if any
  const selectedText = window.getSelection().toString();

  // Get page title
  const title = document.title ||
                getMetaContent('og:title', 'twitter:title') ||
                document.querySelector('h1')?.textContent;

  // Get description
  const description = getMetaContent('description', 'og:description') ||
                      getMetaContent('twitter:description', 'description') ||
                      document.querySelector('p')?.textContent.substring(0, 300);

  // Get author
  const author = getMetaContent('author', 'article:author');

  // Get main content
  let mainContent = '';
  const article = document.querySelector('article');
  const main = document.querySelector('main');

  if (article) {
    mainContent = article.textContent;
  } else if (main) {
    mainContent = main.textContent;
  } else {
    mainContent = document.body.textContent;
  }

  return {
    url: window.location.href,
    title: title ? title.trim() : window.location.href,
    description: description ? description.trim() : '',
    author: author ? author.trim() : null,
    selectedText: selectedText ? selectedText.trim() : null,
    content: mainContent ? mainContent.trim().substring(0, 10000) : null
  };
}
