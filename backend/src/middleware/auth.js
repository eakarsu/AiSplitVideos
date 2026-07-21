const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if ((process.env.JWT_SECRET || '').length < 32) return res.status(503).json({ error: 'Secure JWT configuration required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded.tenantId || !decoded.role || !Array.isArray(decoded.subjectIds)) return res.status(401).json({ error: 'Signed tenant, role, and subject scope required' });
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
