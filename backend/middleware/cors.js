// CORS middleware to allow Chrome extension and production access
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // In production, allow same-origin requests (frontend and backend on same domain)
  // In development, allow localhost and chrome-extension origins
  if (process.env.NODE_ENV === 'production') {
    // Allow same-origin or render.com domains
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

module.exports = corsMiddleware;
