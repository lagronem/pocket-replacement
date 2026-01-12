const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use /tmp for production (Render, etc.) or local data directory for development
const dbPath = process.env.NODE_ENV === 'production'
  ? '/tmp/pocket.db'
  : path.join(__dirname, '../../data/pocket.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a promise to track initialization
let dbReady = null;

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods for easier use
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.getAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Create schema with proper sequencing
async function initializeSchema() {
  try {
    // Main items table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('url', 'note', 'pdf', 'image', 'screenshot')),
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        file_path TEXT,
        favicon_path TEXT,
        excerpt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        archived INTEGER DEFAULT 0,
        favorite INTEGER DEFAULT 0
      )
    `);

    // Full-text search virtual table using FTS5
    await db.runAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        title,
        content,
        excerpt,
        content=items,
        content_rowid=id
      )
    `);

    // Triggers to keep FTS table in sync
    await db.runAsync(`
      CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
        INSERT INTO items_fts(rowid, title, content, excerpt)
        VALUES (new.id, new.title, new.content, new.excerpt);
      END
    `);

    await db.runAsync(`
      CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
        DELETE FROM items_fts WHERE rowid = old.id;
      END
    `);

    await db.runAsync(`
      CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
        UPDATE items_fts SET title = new.title, content = new.content, excerpt = new.excerpt
        WHERE rowid = new.id;
      END
    `);

    // Tags table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#666666',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Many-to-many relationship for item tags
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS item_tags (
        item_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Metadata table for URL items
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS url_metadata (
        item_id INTEGER PRIMARY KEY,
        domain TEXT,
        author TEXT,
        published_date TEXT,
        word_count INTEGER,
        reading_time_minutes INTEGER,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)');
    await db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC)');
    await db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_archived ON items(archived)');
    await db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_favorite ON items(favorite)');
    await db.runAsync('CREATE INDEX IF NOT EXISTS idx_url_metadata_domain ON url_metadata(domain)');
    await db.runAsync('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)');

    // Schema version tracking
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert initial version if not exists
    const row = await db.getAsync('SELECT version FROM schema_version WHERE version = 1');
    if (!row) {
      await db.runAsync('INSERT INTO schema_version (version) VALUES (1)');
    }

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Initialize and export as a promise
dbReady = initializeSchema();

db.ready = () => dbReady;

module.exports = db;
