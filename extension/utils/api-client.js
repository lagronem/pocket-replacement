// API client for Chrome extension

const API_BASE = 'https://pocket-replacement.onrender.com/api';

const apiClient = {
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  async saveItem(data) {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save item');
    }

    return await response.json();
  },

  async saveItemWithFile(formData) {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save item');
    }

    return await response.json();
  }
};
