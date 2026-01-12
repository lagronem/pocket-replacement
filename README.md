# Pocket Replacement

A local-first, privacy-focused read-it-later app with Chrome extension support. Save URLs, notes, screenshots, PDFs, and images - all stored locally on your machine.

## Features

- **One-click saving** via Chrome extension
- **Multiple content types**: URLs, notes, PDFs, images, screenshots
- **Full-text search** using SQLite FTS5
- **Tag system** for organization
- **Local-first**: All data stored on your machine
- **Works offline**: No internet required after setup
- **Free & private**: No cloud services, no tracking

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

For development with auto-reload:
```bash
npm run dev
```

### 3. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The Pocket Saver extension should now appear in your toolbar

### 4. Add Extension Icons (Optional)

Create three PNG icons (16x16, 48x48, 128x128) and place them in `extension/icons/`:
- `icon16.png`
- `icon48.png`
- `icon128.png`

See `extension/icons/README.md` for details.

## Usage

### Web Interface

Visit `http://localhost:3000` to:
- Browse all saved items
- Search your library
- Filter by type, favorites, tags
- View and manage items
- Add items manually

### Chrome Extension

Click the extension icon to:
- **Save This Page**: Saves the current page with metadata
- **Save Screenshot**: Captures and saves a screenshot
- **Quick Note**: Write and save a quick note

You can also right-click on any page, link, or image to save it.

### Adding Items

**Save a URL:**
```
Click extension → Save This Page
```

**Save a Note:**
```
Click extension → Quick Note → Enter title and content
```

**Save a Screenshot:**
```
Click extension → Save Screenshot
```

**Upload a PDF or Image:**
```
Web interface → + Add Item → File Upload
```

## Project Structure

```
pocket-replacement/
├── backend/              # Node.js server
│   ├── server.js        # Main entry point
│   ├── config/          # Database configuration
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── middleware/      # Express middleware
├── frontend/            # Web interface
│   ├── index.html      # Main page
│   ├── css/            # Styles
│   └── js/             # JavaScript
├── extension/           # Chrome extension
│   ├── manifest.json   # Extension config
│   ├── popup/          # Extension popup UI
│   ├── background/     # Service worker
│   └── utils/          # Utilities
└── data/               # SQLite database & files
    ├── pocket.db       # Database
    └── files/          # Uploaded files
```

## API Endpoints

### Items

- `GET /api/items` - List items (with pagination, filters)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/:id/file` - Get item file

### Tags

- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Search

- `GET /api/search?q=query` - Full-text search

### Health

- `GET /api/health` - Server health check

## Configuration

Edit `.env` to customize:

```env
PORT=3000                    # Server port
DATABASE_PATH=./data/pocket.db  # Database location
FILES_PATH=./data/files      # Files directory
MAX_FILE_SIZE=52428800       # Max upload size (50MB)
```

## Database

Uses SQLite with FTS5 (Full-Text Search) for fast searching. The database includes:

- **items**: Main content storage
- **items_fts**: Full-text search index
- **tags**: Tag definitions
- **item_tags**: Item-tag relationships
- **url_metadata**: Additional metadata for URLs

## Backup

Your data is stored in the `data/` directory:
- `data/pocket.db` - SQLite database
- `data/files/` - Uploaded files

To backup, simply copy the entire `data/` folder.

## Troubleshooting

### Server won't start

Make sure port 3000 is available. Change the port in `.env` if needed.

### Extension can't connect to server

1. Make sure the server is running (`npm start`)
2. Check that the server is at `http://localhost:3000`
3. If you changed the port, update `extension/utils/api-client.js`

### Icons not showing in extension

Add PNG icons to `extension/icons/` or the extension will use Chrome's default icon.

### File upload fails

Check the file size - default limit is 50MB. Increase `MAX_FILE_SIZE` in `.env` if needed.

## Development

### Run in development mode

```bash
npm run dev
```

This uses nodemon for auto-reload on code changes.

### Database migrations

The database schema is automatically initialized on first run. If you need to reset:

```bash
# Stop the server
# Delete data/pocket.db
# Restart the server - it will recreate the database
```

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript, CSS3
- **Extension**: Chrome Manifest V3
- **Search**: SQLite FTS5 with BM25 ranking
- **File Processing**:
  - PDFs: pdf-parse
  - Images: sharp
  - Metadata: jsdom, @mozilla/readability

## License

MIT

## Privacy

All data is stored locally on your machine. No telemetry, no tracking, no cloud services. Your data never leaves your computer unless you explicitly choose to sync or backup.
