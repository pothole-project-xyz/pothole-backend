const { query } = require('../config/db');

// GET /api/users  (admin only)
async function listUsers(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/:id/status  (admin only — activate/deactivate)
async function updateUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const { rows } = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active`,
      [Boolean(isActive), req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/:id/role  (admin only)
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'authority'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const { rows } = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUserStatus, updateUserRole };
