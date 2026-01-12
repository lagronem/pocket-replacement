// Tag management

async function loadTags() {
  try {
    const tags = await api.getTags();
    renderTags(tags);
  } catch (error) {
    console.error('Error loading tags:', error);
  }
}

function renderTags(tags) {
  const container = document.getElementById('tagsList');
  container.innerHTML = '';

  if (tags.length === 0) {
    container.innerHTML = '<p style="font-size: 0.875rem; color: var(--text-secondary);">No tags yet</p>';
    return;
  }

  tags.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'tag-badge';
    badge.textContent = `${tag.name} (${tag.item_count})`;
    badge.dataset.tagId = tag.id;

    badge.addEventListener('click', () => {
      filterByTag(tag.id, badge);
    });

    container.appendChild(badge);
  });
}

function filterByTag(tagId, badgeElement) {
  // Toggle active state
  const wasActive = badgeElement.classList.contains('active');

  // Remove active from all tags
  document.querySelectorAll('.tag-badge').forEach(b => b.classList.remove('active'));

  if (!wasActive) {
    badgeElement.classList.add('active');
    currentFilters.tag = tagId;
  } else {
    currentFilters.tag = null;
  }

  currentFilters.page = 1;
  loadItems();
}

// Add tag button handler
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addTagBtn')?.addEventListener('click', async () => {
    const tagName = prompt('Enter tag name:');
    if (tagName && tagName.trim()) {
      try {
        await api.createTag({ name: tagName.trim() });
        await loadTags();
      } catch (error) {
        console.error('Error creating tag:', error);
        alert('Failed to create tag');
      }
    }
  });
});
