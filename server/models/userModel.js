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
    const sql = `SELECT user_id, name, email, created_at FROM users WHERE user_id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  },

  /**
   * Insert a new user into the database
   */
  async create(name, email, hashedPassword) {
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    const [result] = await db.query(sql, [name, email, hashedPassword]);
    return result.insertId;
  }
};

module.exports = User;
