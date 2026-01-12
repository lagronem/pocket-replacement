# Getting Started with Your Pocket Replacement

Congratulations! Your local-first read-it-later app is ready to use.

## Quick Start (3 Steps)

### 1. Install Dependencies

The dependencies are already installed, but if you need to reinstall them:

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   Pocket Replacement Server Running   ║
╠════════════════════════════════════════╣
║  URL: http://localhost:3000          ║
║  API: http://localhost:3000/api     ║
╚════════════════════════════════════════╝
```

### 3. Open Your Browser

Visit http://localhost:3000 to see your library!

## Installing the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension icon should now appear in your toolbar

### Adding Extension Icons (Optional)

To make your extension look nicer:

1. Create three PNG icons (16x16, 48x48, 128x128 pixels)
2. Save them in `extension/icons/` as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

Quick tip: You can screenshot the 📚 emoji and resize it, or use a free icon generator online.

## Using Your App

### Saving Content

**From the Chrome Extension:**
- Click the extension icon while on any page
- Click "Save This Page" to save the current webpage
- Click "Save Screenshot" to capture the visible area
- Click "Quick Note" to write a quick note
- Add tags in the "Quick Tags" field for easy organization

**From the Web Interface:**
- Click "+ Add Item" in the top right
- Choose URL, Note, or File Upload
- Fill in the details and save

### Browsing and Searching

- Use the search bar at the top to search all your saved content
- Filter by type (URLs, Notes, PDFs, etc.) in the left sidebar
- Click on any item to view its full content
- Star items to mark them as favorites
- Tag items for organization

### Managing Items

- Click any item to view it
- Click the star to mark as favorite
- Click the trash icon to delete
- Edit tags and content as needed

## Features You Have

- **Full-text search**: Search across titles, content, and excerpts
- **Tag system**: Organize with unlimited tags
- **File support**: Save PDFs, images, and screenshots
- **URL metadata**: Automatically extracts titles, descriptions, and favicons
- **PDF text extraction**: Search inside your PDF documents
- **Screenshot capture**: One-click screenshots from the extension
- **Favorites**: Star important items
- **Archive**: Hide items without deleting them
- **Local storage**: Everything stays on your computer

## Troubleshooting

### Server won't start
- Make sure port 3000 is available
- Check if another app is using port 3000
- Try changing the port in `.env` file

### Extension can't save items
- Make sure the server is running (`npm start`)
- Check that you're accessing `http://localhost:3000`
- Look in the extension popup for error messages

### "Database is locked" error
- Close any other instances of the app
- Delete `data/pocket.db-wal` and `data/pocket.db-shm` files
- Restart the server

## Next Steps

1. **Backup your data**: Copy the `data/` folder regularly
2. **Customize**: Edit the colors and styling in `frontend/css/styles.css`
3. **Import bookmarks**: Use the web interface to add your existing bookmarks
4. **Explore**: Try the right-click context menu in Chrome to save links and images

## Tips for Success

- Use descriptive tags to make searching easier
- The extension saves your recent tags for quick reuse
- Full-text search is powerful - try searching for partial words
- Archive items you might need later but don't want in your main view
- PDFs are automatically processed for searchable text

## Need Help?

Check the main [README.md](README.md) for:
- Full API documentation
- Configuration options
- Development instructions
- Architecture details

---

Enjoy your new privacy-focused, local-first read-it-later app!
