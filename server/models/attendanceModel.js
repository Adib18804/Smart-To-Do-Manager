const db = require('../config/db');

const Attendance = {
  /**
   * Fetch all attendance records for a specific user with filters
   */
  async getAll(userId, { search = '', sortBy = 'date_desc' } = {}) {
    let sql = `SELECT * FROM attendance WHERE user_id = ?`;
    const params = [userId];

    if (search.trim()) {
      sql += ` AND (subject LIKE ?)`;
      params.push(`%${search}%`);
    }

    // Sort mappings
    switch (sortBy) {
      case 'date_asc':
        sql += ` ORDER BY date ASC`;
        break;
      case 'date_desc':
      default:
        sql += ` ORDER BY date DESC`;
        break;
    }

    const [rows] = await db.query(sql, params);
    return rows;
  },

  /**
   * Get a single attendance record by ID
   */
  async findById(userId, attendanceId) {
    const sql = `SELECT * FROM attendance WHERE user_id = ? AND attendance_id = ?`;
    const [rows] = await db.query(sql, [userId, attendanceId]);
    return rows[0];
  },

  /**
   * Create a new attendance record
   */
  async create(userId, { subject, date, status }) {
    const sql = `INSERT INTO attendance (user_id, subject, date, status) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      userId,
      subject,
      date,
      status || 'Present'
    ]);
    return result.insertId;
  },

  /**
   * Update an existing attendance record
   */
  async update(userId, attendanceId, { subject, date, status }) {
    const sql = `
      UPDATE attendance 
      SET subject = ?, date = ?, status = ? 
      WHERE user_id = ? AND attendance_id = ?
    `;
    const [result] = await db.query(sql, [
      subject,
      date,
      status,
      userId,
      attendanceId
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Delete an attendance record
   */
  async delete(userId, attendanceId) {
    const sql = `DELETE FROM attendance WHERE user_id = ? AND attendance_id = ?`;
    const [result] = await db.query(sql, [userId, attendanceId]);
    return result.affectedRows > 0;
  },

  /**
   * Get attendance statistics for dashboard
   */
  async getStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
      FROM attendance 
      WHERE user_id = ?
    `;
    const [rows] = await db.query(sql, [userId]);
    return {
      total: rows[0].total || 0,
      present: rows[0].present || 0,
      absent: rows[0].absent || 0,
      late: rows[0].late || 0
    };
  }
};

module.exports = Attendance;
