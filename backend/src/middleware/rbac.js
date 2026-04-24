const db = require('../db');

const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT r.name FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );
      const userRoles = result.rows.map(r => r.name);
      const hasRole = allowedRoles.some(role => userRoles.includes(role));
      if (!hasRole) {
        return res.status(403).json({ error: 'Insufficient role permissions' });
      }
      req.userRoles = userRoles;
      next();
    } catch (error) {
      console.error('RBAC error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT DISTINCT r.permissions FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );
      const allPermissions = new Set();
      result.rows.forEach(r => {
        (r.permissions || []).forEach(p => allPermissions.add(p));
      });
      const hasPermission = permissions.some(p => allPermissions.has(p));
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.userPermissions = [...allPermissions];
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = { requireRole, requirePermission };
