const db = require('../config/db');

const User = {
  /**
   * Find user by their email address
   */
  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await db.query(sql, [email]);
    return rows[0];
  },

  /**
   * Find user by their user ID
   */
  async findById(id) {
    const sql = `SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  },

  /**
   * Insert a new user into the database
   */
  async create(name, email, hashedPassword, role = 'User') {
    const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(sql, [name, email, hashedPassword, role]);
    return result.insertId;
  },

  /**
   * Set reset token for password recovery
   */
  async updateResetToken(email, token, expires) {
    const sql = `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?`;
    const [result] = await db.query(sql, [token, expires, email]);
    return result.affectedRows > 0;
  },

  /**
   * Find user by password reset token
   */
  async findByResetToken(token) {
    const sql = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()`;
    const [rows] = await db.query(sql, [token]);
    return rows[0];
  },

  /**
   * Update user password and clear reset token
   */
  async updatePassword(userId, hashedPassword) {
    const sql = `UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?`;
    const [result] = await db.query(sql, [hashedPassword, userId]);
    return result.affectedRows > 0;
  },

  /**
   * Get all users (for Super Admin)
   */
  async getAll() {
    const sql = `SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC`;
    const [rows] = await db.query(sql);
    return rows;
  },

  /**
   * Update user details (for Super Admin)
   */
  async updateUser(userId, { name, email, role }) {
    const sql = `UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?`;
    const [result] = await db.query(sql, [name, email, role, userId]);
    return result.affectedRows > 0;
  },

  /**
   * Delete user (for Super Admin)
   */
  async deleteUser(userId) {
    const sql = `DELETE FROM users WHERE user_id = ?`;
    const [result] = await db.query(sql, [userId]);
    return result.affectedRows > 0;
  }
};

module.exports = User;
