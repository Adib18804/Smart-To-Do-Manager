const Expense = require('../models/expenseModel');
const Activity = require('../models/activityModel');

const expenseController = {
  /**
   * Get all expenses for user
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const expenses = await Expense.getAll(userId);
      return res.json({ success: true, expenses });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get single expense details
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const expenseId = req.params.id;

      const expense = await Expense.findById(userId, expenseId);
      if (!expense) {
        return res.status(404).json({ success: false, error: 'Expense not found.' });
      }
      return res.json({ success: true, expense });
    } catch (error) {
      console.error('Error fetching expense:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Add a new expense record
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { title, amount, category, expense_date, notes } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Expense description/title is required.' });
      }

      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Valid positive amount is required.' });
      }

      if (!expense_date) {
        return res.status(400).json({ success: false, error: 'Expense date is required.' });
      }

      const expenseId = await Expense.create(userId, { title, amount, category, expense_date, notes });

      await Activity.log(req.session.userId, 'Create', 'Expenses', `Logged expense: "${title}" - ৳${amount}`);

      return res.status(201).json({ success: true, message: 'Expense logged successfully.', expenseId });
    } catch (error) {
      console.error('Error creating expense:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update an existing expense details
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const expenseId = req.params.id;
      const { title, amount, category, expense_date, notes } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Expense description/title is required.' });
      }

      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Valid positive amount is required.' });
      }

      if (!expense_date) {
        return res.status(400).json({ success: false, error: 'Expense date is required.' });
      }

      const originalExpense = await Expense.findById(userId, expenseId);
      if (!originalExpense) {
        return res.status(404).json({ success: false, error: 'Expense not found.' });
      }

      const updated = await Expense.update(userId, expenseId, { title, amount, category, expense_date, notes });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update expense.' });
      }

      await Activity.log(req.session.userId, 'Update', 'Expenses', `Updated expense: "${title}" (from ৳${originalExpense.amount} to ৳${amount})`);

      return res.json({ success: true, message: 'Expense updated successfully.' });
    } catch (error) {
      console.error('Error updating expense:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete an expense
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const expenseId = req.params.id;

      const expense = await Expense.findById(userId, expenseId);
      if (!expense) {
        return res.status(404).json({ success: false, error: 'Expense not found.' });
      }

      const deleted = await Expense.delete(userId, expenseId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete expense.' });
      }

      await Activity.log(req.session.userId, 'Delete', 'Expenses', `Deleted expense: "${expense.title}" - ৳${expense.amount}`);

      return res.json({ success: true, message: 'Expense deleted successfully.' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Fetch specific expense aggregates for independent chart queries
   */
  async getAnalytics(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      
      const monthlyTotal = await Expense.getMonthlyTotal(userId);
      const categoryTotals = await Expense.getCategoryTotals(userId);
      const monthlyTrend = await Expense.getMonthlyTrend(userId);

      return res.json({
        success: true,
        analytics: {
          monthlyTotal,
          categoryTotals,
          monthlyTrend
        }
      });
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = expenseController;
