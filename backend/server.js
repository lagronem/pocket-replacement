require('dotenv').config();
const express = require('express');
const path = require('path');
const corsMiddleware = require('./middleware/cors');
const fileStorage = require('./services/file-storage');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize server after database is ready
async function startServer() {
  try {
    // Wait for database to be ready
    await db.ready();

    // Ensure file directories exist on startup
    fileStorage.ensureDirectories();

    // Middleware
    app.use(corsMiddleware);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Static files for frontend with MIME types
    app.use(express.static(path.join(__dirname, '../frontend'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));

    // API Routes
    app.use('/api/items', require('./routes/items'));
    app.use('/api/tags', require('./routes/tags'));
    app.use('/api/search', require('./routes/search'));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Serve frontend for all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Pocket Replacement Server Running   ║
╠════════════════════════════════════════╣
║  URL: http://localhost:${PORT}          ║
║  API: http://localhost:${PORT}/api     ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
