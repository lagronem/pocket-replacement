// Popup logic

let currentTab = null;
let pageMetadata = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkServerStatus();
  await getCurrentTab();
  attachEventListeners();
  loadSavedTags();
});

// Check if server is running
async function checkServerStatus() {
  const status = document.getElementById('serverStatus');
  const isOnline = await apiClient.checkHealth();

  if (isOnline) {
    status.classList.remove('offline');
    status.title = 'Server is running';
  } else {
    status.classList.add('offline');
    status.title = 'Server is offline';
    showError('Server is not running. Please start the server at http://localhost:3000');
  }
}

// Get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Get page metadata using content script
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageMetadata
    });

    pageMetadata = result.result;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    pageMetadata = {
      title: tab.title,
      url: tab.url
    };
  }
}

// Function to inject into page for metadata extraction
function extractPageMetadata() {
  const getMetaContent = (name, property) => {
    let meta = document.querySelector(`meta[name="${name}"]`) ||
                document.querySelector(`meta[property="${property}"]`);
    return meta ? meta.content : null;
  };

  return {
    title: document.title,
    url: window.location.href,
    description: getMetaContent('description', 'og:description') ||
                 document.querySelector('meta[name="description"]')?.content,
    author: getMetaContent('author', 'article:author'),
    selectedText: window.getSelection().toString()
  };
}

// Attach event listeners
function attachEventListeners() {
  // Save current page
  document.getElementById('savePageBtn').addEventListener('click', async () => {
    await savePage();
  });

  // Save screenshot
  document.getElementById('saveScreenshotBtn').addEventListener('click', async () => {
    await saveScreenshot();
  });

  // Show note form
  document.getElementById('saveNoteBtn').addEventListener('click', () => {
    document.getElementById('noteForm').style.display = 'block';
    document.getElementById('noteTitle').focus();
  });

  // Save note
  document.getElementById('saveNoteSubmitBtn').addEventListener('click', async () => {
    await saveNote();
  });

  // Cancel note
  document.getElementById('cancelNoteBtn').addEventListener('click', () => {
    document.getElementById('noteForm').style.display = 'none';
    clearNoteForm();
  });
}

// Save current page
async function savePage() {
  try {
    showLoading();

    const tags = document.getElementById('quickTags').value.trim();

    const data = {
      type: 'url',
      url: currentTab.url,
      title: pageMetadata.title,
      excerpt: pageMetadata.description,
      tags: tags || null
    };

    console.log('Attempting to save:', data);
    const result = await apiClient.saveItem(data);
    console.log('Save result:', result);

    showSuccess('Page saved successfully!');
  } catch (error) {
    console.error('Error saving page:', error);
    showError('Failed to save page: ' + error.message);
  }
}

// Save screenshot
async function saveScreenshot() {
  try {
    showLoading();

    const dataUrl = await chrome.tabs.captureVisibleTab(currentTab.windowId, {
      format: 'png'
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const tags = document.getElementById('quickTags').value.trim();

    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'screenshot.png');
    formData.append('type', 'screenshot');
    formData.append('title', `Screenshot: ${currentTab.title}`);
    if (tags) formData.append('tags', tags);

    await apiClient.saveItemWithFile(formData);

    showSuccess('Screenshot saved successfully!');
  } catch (error) {
    console.error('Error saving screenshot:', error);
    showError('Failed to save screenshot: ' + error.message);
  }
}

// Save note
async function saveNote() {
  try {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const tags = document.getElementById('noteTags').value.trim();

    if (!title || !content) {
      showError('Please enter both title and content');
      return;
    }

    showLoading();

    const data = {
      type: 'note',
      title,
      content,
      tags: tags || null
    };

    await apiClient.saveItem(data);

    showSuccess('Note saved successfully!');
    document.getElementById('noteForm').style.display = 'none';
    clearNoteForm();
  } catch (error) {
    console.error('Error saving note:', error);
    showError('Failed to save note: ' + error.message);
  }
}

// Clear note form
function clearNoteForm() {
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteTags').value = '';
}

// Load saved tags from storage
async function loadSavedTags() {
  try {
    const result = await chrome.storage.local.get(['recentTags']);
    if (result.recentTags) {
      document.getElementById('quickTags').value = result.recentTags;
    }
  } catch (error) {
    console.error('Error loading saved tags:', error);
  }
}

// Save tags to storage
async function saveTags(tags) {
  try {
    await chrome.storage.local.set({ recentTags: tags });
  } catch (error) {
    console.error('Error saving tags:', error);
  }
}

// Save tags on input
document.addEventListener('DOMContentLoaded', () => {
  const tagsInput = document.getElementById('quickTags');
  if (tagsInput) {
    tagsInput.addEventListener('change', (e) => {
      saveTags(e.target.value);
    });
  }
});

// Show loading state
function showLoading() {
  hideMessages();
  // You could add a loading spinner here
}

// Show success message
function showSuccess(message) {
  hideMessages();
  const successEl = document.getElementById('successMessage');
  successEl.textContent = message;
  successEl.style.display = 'block';

  setTimeout(() => {
    successEl.style.display = 'none';
  }, 3000);
}

// Show error message
function showError(message) {
  hideMessages();
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

// Hide all messages
function hideMessages() {
  document.getElementById('successMessage').style.display = 'none';
  document.getElementById('errorMessage').style.display = 'none';
}
