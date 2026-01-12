const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/search?q=query - Full-text search
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use FTS5 for full-text search with BM25 ranking
    const results = await db.allAsync(`
      SELECT
        items.*,
        items_fts.rank,
        snippet(items_fts, 0, '<mark>', '</mark>', '...', 32) as title_snippet,
        snippet(items_fts, 1, '<mark>', '</mark>', '...', 64) as content_snippet,
        GROUP_CONCAT(t.name) as tags
      FROM items_fts
      JOIN items ON items_fts.rowid = items.id
      LEFT JOIN item_tags it ON items.id = it.item_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE items_fts MATCH ?
      GROUP BY items.id
      ORDER BY items_fts.rank
      LIMIT ? OFFSET ?
    `, [query, limit, offset]);

    // Get total count
    const countResult = await db.getAsync(`
      SELECT COUNT(*) as total
      FROM items_fts
      WHERE items_fts MATCH ?
    `, [query]);

    const total = countResult.total;

    res.json({
      results,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

module.exports = router;
