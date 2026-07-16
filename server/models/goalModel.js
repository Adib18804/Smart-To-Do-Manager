const db = require('../config/db');

const Goal = {
  /**
   * Fetch all goals for a user
   */
  async getAll(userId) {
    const sql = `SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC, created_at DESC`;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Find a single goal by ID
   */
  async findById(userId, goalId) {
    const sql = `SELECT * FROM goals WHERE user_id = ? AND goal_id = ?`;
    const [rows] = await db.query(sql, [userId, goalId]);
    return rows[0];
  },

  /**
   * Create a new goal
   */
  async create(userId, { title, deadline, progress_percentage }) {
    const progress = Math.min(100, Math.max(0, parseInt(progress_percentage) || 0));
    const status = progress === 100 ? 'Completed' : 'Active';
    
    const sql = `INSERT INTO goals (user_id, title, deadline, progress_percentage, status) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [userId, title, deadline, progress, status]);
    return result.insertId;
  },

  /**
   * Update an existing goal
   */
  async update(userId, goalId, { title, deadline, progress_percentage }) {
    const progress = Math.min(100, Math.max(0, parseInt(progress_percentage) || 0));
    const status = progress === 100 ? 'Completed' : 'Active';

    const sql = `
      UPDATE goals 
      SET title = ?, deadline = ?, progress_percentage = ?, status = ? 
      WHERE user_id = ? AND goal_id = ?
    `;
    const [result] = await db.query(sql, [title, deadline, progress, status, userId, goalId]);
    return result.affectedRows > 0;
  },

  /**
   * Quick status or progress percentage update
   */
  async updateProgress(userId, goalId, progress_percentage) {
    const progress = Math.min(100, Math.max(0, parseInt(progress_percentage) || 0));
    const status = progress === 100 ? 'Completed' : 'Active';

    const sql = `UPDATE goals SET progress_percentage = ?, status = ? WHERE user_id = ? AND goal_id = ?`;
    const [result] = await db.query(sql, [progress, status, userId, goalId]);
    return result.affectedRows > 0;
  },

  /**
   * Delete a goal
   */
  async delete(userId, goalId) {
    const sql = `DELETE FROM goals WHERE user_id = ? AND goal_id = ?`;
    const [result] = await db.query(sql, [userId, goalId]);
    return result.affectedRows > 0;
  },

  /**
   * Aggregate Goal statistics
   */
  async getStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
      FROM goals 
      WHERE user_id = ?
    `;
    const [rows] = await db.query(sql, [userId]);
    return {
      total: rows[0].total || 0,
      completed: rows[0].completed || 0,
      active: rows[0].active || 0
    };
  }
};

module.exports = Goal;
