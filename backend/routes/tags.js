const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/tags - List all tags
router.get('/', async (req, res) => {
  try {
    const tags = await db.allAsync(`
      SELECT t.*, COUNT(it.item_id) as item_count
      FROM tags t
      LEFT JOIN item_tags it ON t.id = it.tag_id
      GROUP BY t.id
      ORDER BY t.name
    `);

    res.json(tags);
  } catch (error) {
    console.error('Error listing tags:', error);
    res.status(500).json({ error: 'Failed to list tags' });
  }
});

// POST /api/tags - Create new tag
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag already exists
    const existing = await db.getAsync('SELECT * FROM tags WHERE name = ?', [name]);
    if (existing) {
      return res.status(409).json({ error: 'Tag already exists', tag: existing });
    }

    const result = await db.runAsync('INSERT INTO tags (name, color) VALUES (?, ?)', [name, color || '#666666']);

    const tag = await db.getAsync('SELECT * FROM tags WHERE id = ?', [result.lastID]);

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (color) {
      updates.push('color = ?');
      params.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(req.params.id);

    await db.runAsync(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`, params);

    const tag = await db.getAsync('SELECT * FROM tags WHERE id = ?', [req.params.id]);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', async (req, res) => {
  try {
    const tag = await db.getAsync('SELECT * FROM tags WHERE id = ?', [req.params.id]);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Delete tag (cascades to item_tags)
    await db.runAsync('DELETE FROM tags WHERE id = ?', [req.params.id]);

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;
