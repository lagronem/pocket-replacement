// API Client for communicating with backend

const API_BASE = 'http://localhost:3000/api';

const api = {
  // Items
  async getItems(params = {}) {
    // Filter out null/undefined values
    const cleanParams = {};
    for (let key in params) {
      if (params[key] !== null && params[key] !== undefined) {
        cleanParams[key] = params[key];
      }
    }
    const queryString = new URLSearchParams(cleanParams).toString();
    const response = await fetch(`${API_BASE}/items?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  },

  async getItem(id) {
    const response = await fetch(`${API_BASE}/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch item');
    return await response.json();
  },

  async createItem(data) {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create item');
    return await response.json();
  },

  async createItemWithFile(formData) {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to create item');
    return await response.json();
  },

  async updateItem(id, data) {
    const response = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update item');
    return await response.json();
  },

  async deleteItem(id) {
    const response = await fetch(`${API_BASE}/items/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete item');
    return await response.json();
  },

  getItemFileUrl(id) {
    return `${API_BASE}/items/${id}/file`;
  },

  // Tags
  async getTags() {
    const response = await fetch(`${API_BASE}/tags`);
    if (!response.ok) throw new Error('Failed to fetch tags');
    return await response.json();
  },

  async createTag(data) {
    const response = await fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create tag');
    return await response.json();
  },

  async deleteTag(id) {
    const response = await fetch(`${API_BASE}/tags/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete tag');
    return await response.json();
  },

  // Search
  async search(query, params = {}) {
    const queryParams = new URLSearchParams({ q: query, ...params }).toString();
    const response = await fetch(`${API_BASE}/search?${queryParams}`);
    if (!response.ok) throw new Error('Failed to search');
    return await response.json();
  },

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
