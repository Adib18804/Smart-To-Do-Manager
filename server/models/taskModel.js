const db = require('../config/db');

const Task = {
  /**
   * Fetch all tasks for a specific user with filters, search, and sorting
   */
  async getAll(userId, { search = '', status = '', priority = '', sortBy = 'created_at_desc' } = {}) {
    let sql = `SELECT * FROM tasks WHERE user_id = ?`;
    const params = [userId];

    if (search.trim()) {
      sql += ` AND (title LIKE ? OR description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (priority) {
      sql += ` AND priority = ?`;
      params.push(priority);
    }

    // Sort mappings
    switch (sortBy) {
      case 'deadline_asc':
        sql += ` ORDER BY deadline IS NULL ASC, deadline ASC`;
        break;
      case 'deadline_desc':
        sql += ` ORDER BY deadline IS NULL DESC, deadline DESC`;
        break;
      case 'priority_desc': // High to Low
        sql += ` ORDER BY FIELD(priority, 'High', 'Medium', 'Low') ASC, created_at DESC`;
        break;
      case 'priority_asc': // Low to High
        sql += ` ORDER BY FIELD(priority, 'High', 'Medium', 'Low') DESC, created_at DESC`;
        break;
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
   * Get a single task by ID
   */
  async findById(userId, taskId) {
    const sql = `SELECT * FROM tasks WHERE user_id = ? AND task_id = ?`;
    const [rows] = await db.query(sql, [userId, taskId]);
    return rows[0];
  },

  /**
   * Create a new task
   */
  async create(userId, { title, description, priority, status, deadline }) {
    const sql = `INSERT INTO tasks (user_id, title, description, priority, status, deadline) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      userId,
      title,
      description || null,
      priority || 'Medium',
      status || 'Pending',
      deadline || null
    ]);
    return result.insertId;
  },

  /**
   * Update an existing task
   */
  async update(userId, taskId, { title, description, priority, status, deadline }) {
    const sql = `
      UPDATE tasks 
      SET title = ?, description = ?, priority = ?, status = ?, deadline = ? 
      WHERE user_id = ? AND task_id = ?
    `;
    const [result] = await db.query(sql, [
      title,
      description || null,
      priority || 'Medium',
      status || 'Pending',
      deadline || null,
      userId,
      taskId
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Quick status update (e.g. mark complete)
   */
  async updateStatus(userId, taskId, status) {
    const sql = `UPDATE tasks SET status = ? WHERE user_id = ? AND task_id = ?`;
    const [result] = await db.query(sql, [status, userId, taskId]);
    return result.affectedRows > 0;
  },

  /**
   * Delete a task
   */
  async delete(userId, taskId) {
    const sql = `DELETE FROM tasks WHERE user_id = ? AND task_id = ?`;
    const [result] = await db.query(sql, [userId, taskId]);
    return result.affectedRows > 0;
  },

  /**
   * Aggregate Task Stats for the User
   */
  async getStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status != 'Completed' THEN 1 ELSE 0 END) as pending
      FROM tasks 
      WHERE user_id = ?
    `;
    const [rows] = await db.query(sql, [userId]);
    return {
      total: rows[0].total || 0,
      completed: rows[0].completed || 0,
      pending: rows[0].pending || 0
    };
  },

  /**
   * Get upcoming deadlines for Tasks widget
   */
  async getUpcomingDeadlines(userId, limit = 5) {
    const sql = `
      SELECT task_id, title, deadline, priority, status 
      FROM tasks 
      WHERE user_id = ? AND status != 'Completed' AND deadline IS NOT NULL AND deadline >= CURDATE()
      ORDER BY deadline ASC 
      LIMIT ?
    `;
    const [rows] = await db.query(sql, [userId, limit]);
    return rows;
  }
};

module.exports = Task;
