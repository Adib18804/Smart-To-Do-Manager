const db = require('../config/db');

const Category = {
  /**
   * Fetch all categories for a specific user
   */
  async getAll(userId) {
    const sql = `SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC`;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Get a single category by ID
   */
  async findById(userId, categoryId) {
    const sql = `SELECT * FROM categories WHERE user_id = ? AND category_id = ?`;
    const [rows] = await db.query(sql, [userId, categoryId]);
    return rows[0];
  },

  /**
   * Check if category name exists for user
   */
  async findByName(userId, name) {
    const sql = `SELECT * FROM categories WHERE user_id = ? AND name = ?`;
    const [rows] = await db.query(sql, [userId, name]);
    return rows[0];
  },

  /**
   * Create a new category
   */
  async create(userId, { name, color }) {
    const sql = `INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)`;
    const [result] = await db.query(sql, [
      userId,
      name,
      color || null
    ]);
    return result.insertId;
  },

  /**
   * Update an existing category
   */
  async update(userId, categoryId, { name, color }) {
    const sql = `
      UPDATE categories 
      SET name = ?, color = ? 
      WHERE user_id = ? AND category_id = ?
    `;
    const [result] = await db.query(sql, [
      name,
      color || null,
      userId,
      categoryId
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Delete a category
   */
  async delete(userId, categoryId) {
    const sql = `DELETE FROM categories WHERE user_id = ? AND category_id = ?`;
    const [result] = await db.query(sql, [userId, categoryId]);
    return result.affectedRows > 0;
  }
};

module.exports = Category;
