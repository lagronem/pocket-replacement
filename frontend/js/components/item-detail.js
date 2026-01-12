// Item detail modal

let currentItemId = null;

async function openItemDetail(itemId) {
  currentItemId = itemId;

  try {
    const item = await api.getItem(itemId);
    renderItemDetail(item);
    document.getElementById('itemModal').classList.add('active');
  } catch (error) {
    console.error('Error loading item:', error);
    alert('Failed to load item');
  }
}

function renderItemDetail(item) {
  const title = document.getElementById('itemTitle');
  const content = document.getElementById('itemContent');
  const favoriteBtn = document.getElementById('toggleFavoriteBtn');
  const deleteBtn = document.getElementById('deleteItemBtn');

  title.textContent = item.title;

  // Update favorite button
  favoriteBtn.textContent = item.favorite ? '⭐' : '☆';
  favoriteBtn.onclick = async () => {
    await toggleItemFavorite(item.id, !item.favorite);
  };

  // Update delete button
  deleteBtn.onclick = async () => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(item.id);
    }
  };

  // Render content based on type
  content.innerHTML = '';

  // Meta info
  const metaDiv = document.createElement('div');
  metaDiv.style.marginBottom = '1.5rem';
  metaDiv.style.padding = '1rem';
  metaDiv.style.backgroundColor = 'var(--bg-color)';
  metaDiv.style.borderRadius = 'var(--radius)';

  const metaInfo = [];
  metaInfo.push(`<strong>Type:</strong> ${item.type}`);
  metaInfo.push(`<strong>Created:</strong> ${formatDate(item.created_at)}`);

  if (item.tags) {
    const tagBadges = item.tags.split(',').map(tag =>
      `<span class="item-tag">${tag}</span>`
    ).join(' ');
    metaInfo.push(`<strong>Tags:</strong> ${tagBadges}`);
  }

  if (item.url) {
    metaInfo.push(`<strong>URL:</strong> <a href="${item.url}" target="_blank" rel="noopener">${item.url}</a>`);
  }

  metaDiv.innerHTML = metaInfo.join('<br>');
  content.appendChild(metaDiv);

  // Content based on type
  if (item.type === 'url') {
    if (item.content) {
      const contentDiv = document.createElement('div');
      contentDiv.style.lineHeight = '1.8';
      contentDiv.textContent = item.content;
      content.appendChild(contentDiv);
    }

    if (item.metadata) {
      const metadataDiv = document.createElement('div');
      metadataDiv.style.marginTop = '1rem';
      metadataDiv.style.fontSize = '0.875rem';
      metadataDiv.style.color = 'var(--text-secondary)';
      const details = [];
      if (item.metadata.domain) details.push(`Domain: ${item.metadata.domain}`);
      if (item.metadata.author) details.push(`Author: ${item.metadata.author}`);
      if (item.metadata.reading_time_minutes) details.push(`Reading time: ${item.metadata.reading_time_minutes} min`);
      metadataDiv.innerHTML = details.join(' • ');
      content.appendChild(metadataDiv);
    }
  } else if (item.type === 'note') {
    const contentDiv = document.createElement('div');
    contentDiv.style.lineHeight = '1.8';
    contentDiv.style.whiteSpace = 'pre-wrap';
    contentDiv.textContent = item.content || '';
    content.appendChild(contentDiv);
  } else if (item.type === 'pdf') {
    const pdfLink = document.createElement('a');
    pdfLink.href = api.getItemFileUrl(item.id);
    pdfLink.target = '_blank';
    pdfLink.className = 'btn btn-primary';
    pdfLink.textContent = 'Open PDF';
    pdfLink.style.display = 'inline-block';
    pdfLink.style.marginBottom = '1rem';
    content.appendChild(pdfLink);

    if (item.content) {
      const extractedText = document.createElement('div');
      extractedText.style.marginTop = '1rem';
      extractedText.innerHTML = '<h4>Extracted Text:</h4>';
      const textDiv = document.createElement('pre');
      textDiv.style.whiteSpace = 'pre-wrap';
      textDiv.style.fontSize = '0.875rem';
      textDiv.textContent = item.content.substring(0, 5000) + (item.content.length > 5000 ? '...' : '');
      extractedText.appendChild(textDiv);
      content.appendChild(extractedText);
    }
  } else if (item.type === 'image' || item.type === 'screenshot') {
    const img = document.createElement('img');
    img.src = api.getItemFileUrl(item.id);
    img.style.maxWidth = '100%';
    img.style.borderRadius = 'var(--radius)';
    content.appendChild(img);
  }
}

async function toggleItemFavorite(itemId, favorite) {
  try {
    await api.updateItem(itemId, { favorite });
    await openItemDetail(itemId); // Refresh
    await loadItems(); // Refresh list
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}

async function deleteItem(itemId) {
  try {
    await api.deleteItem(itemId);
    document.getElementById('itemModal').classList.remove('active');
    await loadItems();
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete item');
  }
}
