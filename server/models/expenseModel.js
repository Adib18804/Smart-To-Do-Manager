const db = require('../config/db');

const Expense = {
  /**
   * Get all expenses for a user
   */
  async getAll(userId) {
    const sql = `SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC, created_at DESC`;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Find an expense by ID
   */
  async findById(userId, expenseId) {
    const sql = `SELECT * FROM expenses WHERE user_id = ? AND expense_id = ?`;
    const [rows] = await db.query(sql, [userId, expenseId]);
    return rows[0];
  },

  /**
   * Add a new expense
   */
  async create(userId, { title, amount, category, expense_date, notes }) {
    const sql = `INSERT INTO expenses (user_id, title, amount, category, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      userId,
      title,
      amount,
      category || 'Others',
      expense_date,
      notes || null
    ]);
    return result.insertId;
  },

  /**
   * Update an existing expense
   */
  async update(userId, expenseId, { title, amount, category, expense_date, notes }) {
    const sql = `
      UPDATE expenses 
      SET title = ?, amount = ?, category = ?, expense_date = ?, notes = ? 
      WHERE user_id = ? AND expense_id = ?
    `;
    const [result] = await db.query(sql, [
      title,
      amount,
      category || 'Others',
      expense_date,
      notes || null,
      userId,
      expenseId
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Delete an expense
   */
  async delete(userId, expenseId) {
    const sql = `DELETE FROM expenses WHERE user_id = ? AND expense_id = ?`;
    const [result] = await db.query(sql, [userId, expenseId]);
    return result.affectedRows > 0;
  },

  /**
   * Sum of expenses in the current calendar month
   */
  async getMonthlyTotal(userId) {
    const sql = `
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())
    `;
    const [rows] = await db.query(sql, [userId]);
    return parseFloat(rows[0].total) || 0;
  },

  /**
   * Expense totals grouped by categories for charts
   */
  async getCategoryTotals(userId) {
    const sql = `
      SELECT category, SUM(amount) as total 
      FROM expenses 
      WHERE user_id = ? 
      GROUP BY category
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Monthly trend in spending for the last 6 calendar months
   */
  async getMonthlyTrend(userId) {
    const sql = `
      SELECT 
        DATE_FORMAT(expense_date, '%b %Y') as month_label,
        SUM(amount) as total,
        DATE_FORMAT(expense_date, '%Y-%m') as year_month
      FROM expenses 
      WHERE user_id = ? AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY year_month, month_label
      ORDER BY year_month ASC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  }
};

module.exports = Expense;
