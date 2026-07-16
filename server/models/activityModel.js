const db = require('../config/db');

const Activity = {
  /**
   * Log user action in activity_logs
   */
  async log(userId, activityType, moduleName, description) {
    try {
      const sql = `INSERT INTO activity_logs (user_id, activity_type, module_name, description) VALUES (?, ?, ?, ?)`;
      const [result] = await db.query(sql, [userId, activityType, moduleName, description]);
      return result.insertId;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Fail silently to keep primary app flows working even if log insert fails
      return null;
    }
  },

  /**
   * Fetch recent actions for the dashboard log widget
   */
  async getRecent(userId, limit = 10) {
    const sql = `SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`;
    const [rows] = await db.query(sql, [userId, limit]);
    return rows;
  }
};

module.exports = Activity;
