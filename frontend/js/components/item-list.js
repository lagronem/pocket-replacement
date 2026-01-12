// Item list rendering

// Format date helper (duplicated here for loading order)
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString();
}

function renderItems(items) {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  items.forEach(item => {
    const card = createItemCard(item);
    container.appendChild(card);
  });
}

function createItemCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.id = item.id;

  const header = document.createElement('div');
  header.className = 'item-card-header';

  const typeBadge = document.createElement('span');
  typeBadge.className = `item-type-badge item-type-${item.type}`;
  typeBadge.textContent = item.type;

  const favorite = document.createElement('span');
  favorite.className = 'item-favorite';
  favorite.textContent = item.favorite ? '⭐' : '☆';
  favorite.addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleFavorite(item.id, !item.favorite);
  });

  header.appendChild(typeBadge);
  header.appendChild(favorite);

  const title = document.createElement('h3');
  title.className = 'item-title';
  title.textContent = item.title;

  const excerpt = document.createElement('p');
  excerpt.className = 'item-excerpt';
  excerpt.textContent = item.excerpt || 'No description';

  const meta = document.createElement('div');
  meta.className = 'item-meta';

  const tags = document.createElement('div');
  tags.className = 'item-tags';
  if (item.tags) {
    item.tags.split(',').forEach(tagName => {
      const tag = document.createElement('span');
      tag.className = 'item-tag';
      tag.textContent = tagName;
      tags.appendChild(tag);
    });
  }

  const date = document.createElement('span');
  date.className = 'item-date';
  date.textContent = formatDate(item.created_at);

  meta.appendChild(tags);
  meta.appendChild(date);

  card.appendChild(header);
  card.appendChild(title);
  card.appendChild(excerpt);
  card.appendChild(meta);

  card.addEventListener('click', () => {
    openItemDetail(item.id);
  });

  return card;
}

async function toggleFavorite(itemId, favorite) {
  try {
    await api.updateItem(itemId, { favorite });
    await loadItems();
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}
