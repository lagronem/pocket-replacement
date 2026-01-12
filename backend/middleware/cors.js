// CORS middleware to allow Chrome extension access
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // Allow localhost and chrome-extension origins
  if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost'))) {
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
