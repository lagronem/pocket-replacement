const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const fileStorage = require('../services/file-storage');
const metadataExtractor = require('../services/metadata-extractor');
const pdfProcessor = require('../services/pdf-processor');
const imageProcessor = require('../services/image-processor');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  }
});

// GET /api/items - List items with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const archived = req.query.archived === 'true' ? 1 : 0;
    const favorite = req.query.favorite === 'true' ? 1 : null;
    const type = req.query.type;
    const tagId = req.query.tag;

    let query = `
      SELECT DISTINCT i.*, GROUP_CONCAT(t.name) as tags
      FROM items i
      LEFT JOIN item_tags it ON i.id = it.item_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE i.archived = ?
    `;
    const params = [archived];

    if (favorite !== null) {
      query += ' AND i.favorite = ?';
      params.push(favorite);
    }

    if (type) {
      query += ' AND i.type = ?';
      params.push(type);
    }

    if (tagId) {
      query += ' AND i.id IN (SELECT item_id FROM item_tags WHERE tag_id = ?)';
      params.push(tagId);
    }

    query += ' GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const items = await db.allAsync(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM items WHERE archived = ?';
    const countParams = [archived];

    if (favorite !== null) {
      countQuery += ' AND favorite = ?';
      countParams.push(favorite);
    }

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    if (tagId) {
      countQuery += ' AND id IN (SELECT item_id FROM item_tags WHERE tag_id = ?)';
      countParams.push(tagId);
    }

    const result = await db.getAsync(countQuery, countParams);
    const total = result.total;

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error listing items:', error);
    res.status(500).json({ error: 'Failed to list items' });
  }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await db.getAsync(`
      SELECT i.*, GROUP_CONCAT(t.name) as tags
      FROM items i
      LEFT JOIN item_tags it ON i.id = it.item_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE i.id = ?
      GROUP BY i.id
    `, [req.params.id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get URL metadata if it's a URL item
    if (item.type === 'url') {
      const metadata = await db.getAsync('SELECT * FROM url_metadata WHERE item_id = ?', [item.id]);
      if (metadata) {
        item.metadata = metadata;
      }
    }

    res.json(item);
  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

// POST /api/items - Create new item
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let { type, title, content, url, excerpt, tags } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }

    let filePath = null;
    let faviconPath = null;
    let metadata = null;

    // Handle URL type - extract metadata
    if (type === 'url' && url) {
      try {
        metadata = await metadataExtractor.extractMetadata(url);
        title = title || metadata.title;
        excerpt = excerpt || metadata.excerpt;
        content = content || metadata.content;
        faviconPath = metadata.faviconPath;
      } catch (err) {
        console.error('Metadata extraction failed:', err);
        if (!title) {
          return res.status(400).json({ error: 'Title is required when metadata extraction fails' });
        }
      }
    }

    // Handle PDF upload
    if (type === 'pdf' && req.file) {
      try {
        const pdfData = await pdfProcessor.processPdf(req.file.buffer);
        content = pdfData.text;
        excerpt = excerpt || pdfData.text.substring(0, 500);
        filePath = await fileStorage.saveFile(req.file.buffer, req.file.originalname, 'pdf');
      } catch (err) {
        console.error('PDF processing failed:', err);
        return res.status(400).json({ error: 'Failed to process PDF' });
      }
    }

    // Handle screenshot upload
    if (type === 'screenshot' && req.file) {
      try {
        const processedBuffer = await imageProcessor.processScreenshot(req.file.buffer);
        filePath = await fileStorage.saveFile(processedBuffer, req.file.originalname, 'screenshot');
      } catch (err) {
        console.error('Screenshot processing failed:', err);
        return res.status(400).json({ error: 'Failed to process screenshot' });
      }
    }

    // Handle image upload
    if (type === 'image' && req.file) {
      try {
        const { buffer } = await imageProcessor.processImage(req.file.buffer);
        filePath = await fileStorage.saveFile(buffer, req.file.originalname, 'image');
      } catch (err) {
        console.error('Image processing failed:', err);
        return res.status(400).json({ error: 'Failed to process image' });
      }
    }

    // Validate title is present
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Insert item
    const result = await db.runAsync(`
      INSERT INTO items (type, title, content, url, file_path, favicon_path, excerpt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [type, title, content || null, url || null, filePath, faviconPath, excerpt || null]);

    const itemId = result.lastID;

    // Save URL metadata if available
    if (type === 'url' && metadata) {
      await metadataExtractor.saveUrlMetadata(itemId, metadata);
    }

    // Add tags if provided
    if (tags) {
      const tagNames = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      for (const tagName of tagNames) {
        if (tagName) {
          // Get or create tag
          let tag = await db.getAsync('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (!tag) {
            const tagResult = await db.runAsync('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tag = { id: tagResult.lastID };
          }
          // Link tag to item
          await db.runAsync('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)', [itemId, tag.id]);
        }
      }
    }

    // Get the created item
    const item = await db.getAsync('SELECT * FROM items WHERE id = ?', [itemId]);

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item', message: error.message });
  }
});

// PUT /api/items/:id - Update item
router.put('/:id', async (req, res) => {
  try {
    const { title, content, excerpt, archived, favorite, tags } = req.body;
    const itemId = req.params.id;

    // Check if item exists
    const existingItem = await db.getAsync('SELECT * FROM items WHERE id = ?', [itemId]);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (excerpt !== undefined) {
      updates.push('excerpt = ?');
      params.push(excerpt);
    }
    if (archived !== undefined) {
      updates.push('archived = ?');
      params.push(archived ? 1 : 0);
    }
    if (favorite !== undefined) {
      updates.push('favorite = ?');
      params.push(favorite ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(itemId);

    if (updates.length > 0) {
      await db.runAsync(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', [itemId]);

      // Add new tags
      const tagNames = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      for (const tagName of tagNames) {
        if (tagName) {
          let tag = await db.getAsync('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (!tag) {
            const tagResult = await db.runAsync('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tag = { id: tagResult.lastID };
          }
          await db.runAsync('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)', [itemId, tag.id]);
        }
      }
    }

    // Get updated item
    const item = await db.getAsync(`
      SELECT i.*, GROUP_CONCAT(t.name) as tags
      FROM items i
      LEFT JOIN item_tags it ON i.id = it.item_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE i.id = ?
      GROUP BY i.id
    `, [itemId]);

    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await db.getAsync('SELECT * FROM items WHERE id = ?', [req.params.id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete associated file if exists
    if (item.file_path) {
      try {
        await fileStorage.deleteFile(item.file_path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    // Delete favicon if exists
    if (item.favicon_path) {
      try {
        await fileStorage.deleteFile(item.favicon_path);
      } catch (err) {
        console.error('Error deleting favicon:', err);
      }
    }

    // Delete item (cascades to item_tags and url_metadata)
    await db.runAsync('DELETE FROM items WHERE id = ?', [req.params.id]);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// GET /api/items/:id/file - Serve file
router.get('/:id/file', async (req, res) => {
  try {
    const item = await db.getAsync('SELECT file_path FROM items WHERE id = ?', [req.params.id]);

    if (!item || !item.file_path) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileBuffer = await fileStorage.readFile(item.file_path);
    const mimeType = fileStorage.getMimeType(item.file_path);

    res.setHeader('Content-Type', mimeType);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;
