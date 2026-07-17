const db = require('../config/db');

const Note = {
  /**
   * Fetch all notes for a specific user with filters
   */
  async getAll(userId, { search = '', sortBy = 'created_at_desc' } = {}) {
    let sql = `SELECT * FROM notes WHERE user_id = ?`;
    const params = [userId];

    if (search.trim()) {
      sql += ` AND (title LIKE ? OR content LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Sort mappings
    switch (sortBy) {
      case 'created_at_asc':
        sql += ` ORDER BY created_at ASC`;
        break;
      case 'created_at_desc':
      default:
        sql += ` ORDER BY created_at DESC`;
        break;
    }

    const [rows] = await db.query(sql, params);
    return rows;
  },

  /**
   * Get a single note by ID
   */
  async findById(userId, noteId) {
    const sql = `SELECT * FROM notes WHERE user_id = ? AND note_id = ?`;
    const [rows] = await db.query(sql, [userId, noteId]);
    return rows[0];
  },

  /**
   * Create a new note
   */
  async create(userId, { title, content }) {
    const sql = `INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)`;
    const [result] = await db.query(sql, [
      userId,
      title,
      content || null
    ]);
    return result.insertId;
  },

  /**
   * Update an existing note
   */
  async update(userId, noteId, { title, content }) {
    const sql = `
      UPDATE notes 
      SET title = ?, content = ? 
      WHERE user_id = ? AND note_id = ?
    `;
    const [result] = await db.query(sql, [
      title,
      content || null,
      userId,
      noteId
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Delete a note
   */
  async delete(userId, noteId) {
    const sql = `DELETE FROM notes WHERE user_id = ? AND note_id = ?`;
    const [result] = await db.query(sql, [userId, noteId]);
    return result.affectedRows > 0;
  },

  /**
   * Get count of notes for dashboard
   */
  async getCount(userId) {
    const sql = `SELECT COUNT(*) as count FROM notes WHERE user_id = ?`;
    const [rows] = await db.query(sql, [userId]);
    return rows[0].count || 0;
  }
};

module.exports = Note;
