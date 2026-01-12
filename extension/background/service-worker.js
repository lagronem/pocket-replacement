// Background service worker for Chrome extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Pocket Saver extension installed');

  // Create context menu items
  chrome.contextMenus.create({
    id: 'savePage',
    title: 'Save to Pocket Replacement',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'saveLink',
    title: 'Save Link to Pocket Replacement',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'saveImage',
    title: 'Save Image to Pocket Replacement',
    contexts: ['image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const API_BASE = 'http://localhost:3000/api';

  try {
    if (info.menuItemId === 'savePage') {
      // Save current page
      await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          url: tab.url,
          title: tab.title
        })
      });

      showNotification('Page saved successfully!');
    } else if (info.menuItemId === 'saveLink') {
      // Save link
      await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          url: info.linkUrl,
          title: info.linkUrl
        })
      });

      showNotification('Link saved successfully!');
    } else if (info.menuItemId === 'saveImage') {
      // Save image URL
      await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          url: info.srcUrl,
          title: `Image from ${tab.title}`
        })
      });

      showNotification('Image link saved successfully!');
    }
  } catch (error) {
    console.error('Error saving:', error);
    showNotification('Failed to save. Is the server running?', true);
  }
});

// Show notification
function showNotification(message, isError = false) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: isError ? 'Error' : 'Pocket Saver',
    message: message
  });
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkHealth') {
    checkServerHealth().then(sendResponse);
    return true;
  }
});

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    return false;
  }
}
