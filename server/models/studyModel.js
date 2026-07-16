const db = require('../config/db');

const StudySession = {
  /**
   * Get all study sessions for a user
   */
  async getAll(userId) {
    const sql = `SELECT * FROM study_sessions WHERE user_id = ? ORDER BY study_date DESC, created_at DESC`;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Find a study session by ID
   */
  async findById(userId, sessionId) {
    const sql = `SELECT * FROM study_sessions WHERE user_id = ? AND session_id = ?`;
    const [rows] = await db.query(sql, [userId, sessionId]);
    return rows[0];
  },

  /**
   * Add a new study session
   */
  async create(userId, { subject_name, study_date, duration_hours, notes }) {
    const sql = `INSERT INTO study_sessions (user_id, subject_name, study_date, duration_hours, notes) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      userId,
      subject_name,
      study_date,
      duration_hours,
      notes || null
    ]);
    return result.insertId;
  },

  /**
   * Update an existing study session
   */
  async update(userId, sessionId, { subject_name, study_date, duration_hours, notes }) {
    const sql = `
      UPDATE study_sessions 
      SET subject_name = ?, study_date = ?, duration_hours = ?, notes = ? 
      WHERE user_id = ? AND session_id = ?
    `;
    const [result] = await db.query(sql, [
      subject_name,
      study_date,
      duration_hours,
      notes || null,
      userId,
      sessionId
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Delete a study session
   */
  async delete(userId, sessionId) {
    const sql = `DELETE FROM study_sessions WHERE user_id = ? AND session_id = ?`;
    const [result] = await db.query(sql, [userId, sessionId]);
    return result.affectedRows > 0;
  },

  /**
   * Sum of study hours across all sessions
   */
  async getTotalHours(userId) {
    const sql = `SELECT SUM(duration_hours) as total FROM study_sessions WHERE user_id = ?`;
    const [rows] = await db.query(sql, [userId]);
    return parseFloat(rows[0].total) || 0;
  },

  /**
   * Weekly study stats (past 7 days including today) for line chart
   */
  async getWeeklyStats(userId) {
    const sql = `
      SELECT 
        DATE_FORMAT(study_date, '%a') as weekday,
        SUM(duration_hours) as total_hours,
        study_date
      FROM study_sessions 
      WHERE user_id = ? AND study_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY study_date, weekday
      ORDER BY study_date ASC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Hours grouped by subject
   */
  async getSubjectStats(userId) {
    const sql = `
      SELECT subject_name, SUM(duration_hours) as total_hours 
      FROM study_sessions 
      WHERE user_id = ? 
      GROUP BY subject_name 
      ORDER BY total_hours DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  }
};

module.exports = StudySession;
