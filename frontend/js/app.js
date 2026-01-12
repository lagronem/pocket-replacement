// Main application controller

let currentFilters = {
  page: 1,
  limit: 20,
  archived: false,
  favorite: null,
  type: null,
  tag: null
};

let currentView = 'grid';
let searchTimeout = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await checkServerHealth();
  await loadTags();
  await loadItems();
  attachEventListeners();
});

// Check if server is running
async function checkServerHealth() {
  const isHealthy = await api.checkHealth();
  if (!isHealthy) {
    alert('Warning: Cannot connect to server. Make sure the server is running on http://localhost:3000');
  }
}

// Load items from API
async function loadItems() {
  const container = document.getElementById('itemsContainer');
  const loading = document.getElementById('loadingSpinner');
  const emptyState = document.getElementById('emptyState');
  const pagination = document.getElementById('pagination');

  loading.style.display = 'block';
  container.innerHTML = '';
  emptyState.style.display = 'none';

  try {
    const data = await api.getItems(currentFilters);
    loading.style.display = 'none';

    if (data.items.length === 0) {
      emptyState.style.display = 'block';
      pagination.style.display = 'none';
      return;
    }

    renderItems(data.items);
    renderPagination(data.pagination);
  } catch (error) {
    console.error('Error loading items:', error);
    loading.style.display = 'none';
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Error loading items</p>';
  }
}

// Attach event listeners
function attachEventListeners() {
  // Add item modal
  document.getElementById('addItemBtn').addEventListener('click', () => {
    document.getElementById('addItemModal').classList.add('active');
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('active');
    });
  });

  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      document.getElementById(`${tabName}Tab`).classList.add('active');
    });
  });

  // Save URL
  document.getElementById('saveUrlBtn').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value.trim();
    const tags = document.getElementById('urlTags').value.trim();

    if (!url) {
      alert('Please enter a URL');
      return;
    }

    try {
      await api.createItem({ type: 'url', url, tags });
      document.getElementById('addItemModal').classList.remove('active');
      document.getElementById('urlInput').value = '';
      document.getElementById('urlTags').value = '';
      await loadItems();
    } catch (error) {
      console.error('Error saving URL:', error);
      alert('Failed to save URL');
    }
  });

  // Save note
  document.getElementById('saveNoteBtn').addEventListener('click', async () => {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const tags = document.getElementById('noteTags').value.trim();

    if (!title || !content) {
      alert('Please enter both title and content');
      return;
    }

    try {
      await api.createItem({ type: 'note', title, content, tags });
      document.getElementById('addItemModal').classList.remove('active');
      document.getElementById('noteTitle').value = '';
      document.getElementById('noteContent').value = '';
      document.getElementById('noteTags').value = '';
      await loadItems();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  });

  // Save file
  document.getElementById('saveFileBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const title = document.getElementById('fileTitle').value.trim();
    const tags = document.getElementById('fileTags').value.trim();

    if (!fileInput.files[0]) {
      alert('Please select a file');
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();

    // Determine type based on file
    let type = 'image';
    if (file.type === 'application/pdf') {
      type = 'pdf';
    }

    formData.append('file', file);
    formData.append('type', type);
    formData.append('title', title || file.name);
    if (tags) formData.append('tags', tags);

    try {
      await api.createItemWithFile(formData);
      document.getElementById('addItemModal').classList.remove('active');
      fileInput.value = '';
      document.getElementById('fileTitle').value = '';
      document.getElementById('fileTags').value = '';
      await loadItems();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  });

  // View toggle
  document.getElementById('gridViewBtn').addEventListener('click', () => {
    currentView = 'grid';
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    document.getElementById('itemsContainer').className = 'items-grid';
  });

  document.getElementById('listViewBtn').addEventListener('click', () => {
    currentView = 'list';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
    document.getElementById('itemsContainer').className = 'items-list';
  });

  // Filters
  document.querySelectorAll('.filter-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = e.target.dataset.filter;

      document.querySelectorAll('.filter-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');

      if (filter === 'all') {
        currentFilters.archived = false;
        currentFilters.favorite = null;
      } else if (filter === 'favorite') {
        currentFilters.archived = false;
        currentFilters.favorite = true;
      } else if (filter === 'archived') {
        currentFilters.archived = true;
        currentFilters.favorite = null;
      }

      currentFilters.page = 1;
      loadItems();
    });
  });

  // Type filters
  document.querySelectorAll('.type-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const type = e.target.dataset.type;

      document.querySelectorAll('.type-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');

      currentFilters.type = type || null;
      currentFilters.page = 1;
      loadItems();
    });
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    searchTimeout = setTimeout(async () => {
      if (query) {
        await performSearch(query);
      } else {
        await loadItems();
      }
    }, 300);
  });
}

// Search function
async function performSearch(query) {
  const container = document.getElementById('itemsContainer');
  const loading = document.getElementById('loadingSpinner');
  const emptyState = document.getElementById('emptyState');

  loading.style.display = 'block';
  container.innerHTML = '';
  emptyState.style.display = 'none';

  try {
    const data = await api.search(query);
    loading.style.display = 'none';

    if (data.results.length === 0) {
      emptyState.innerHTML = '<p>No results found for your search.</p>';
      emptyState.style.display = 'block';
      return;
    }

    renderItems(data.results);
  } catch (error) {
    console.error('Error searching:', error);
    loading.style.display = 'none';
  }
}

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById('pagination');

  if (pagination.pages <= 1) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Previous';
  prevBtn.disabled = pagination.page === 1;
  prevBtn.addEventListener('click', () => {
    currentFilters.page--;
    loadItems();
  });
  container.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= pagination.pages; i++) {
    if (
      i === 1 ||
      i === pagination.pages ||
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === pagination.page ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        currentFilters.page = i;
        loadItems();
      });
      container.appendChild(pageBtn);
    } else if (
      i === pagination.page - 3 ||
      i === pagination.page + 3
    ) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.style.padding = '0.5rem';
      container.appendChild(ellipsis);
    }
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = pagination.page === pagination.pages;
  nextBtn.addEventListener('click', () => {
    currentFilters.page++;
    loadItems();
  });
  container.appendChild(nextBtn);
}

// Format date
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
