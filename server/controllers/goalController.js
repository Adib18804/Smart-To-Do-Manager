const Goal = require('../models/goalModel');
const Activity = require('../models/activityModel');

const goalController = {
  /**
   * Get all goals for the user
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const goals = await Goal.getAll(userId);
      return res.json({ success: true, goals });
    } catch (error) {
      console.error('Error fetching goals:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get detail for single goal
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const goalId = req.params.id;

      const goal = await Goal.findById(userId, goalId);
      if (!goal) {
        return res.status(404).json({ success: false, error: 'Goal not found.' });
      }
      return res.json({ success: true, goal });
    } catch (error) {
      console.error('Error fetching goal:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Create a new goal entry
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { title, deadline, progress_percentage } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Goal title is required.' });
      }

      if (!deadline) {
        return res.status(400).json({ success: false, error: 'Goal target deadline date is required.' });
      }

      const progress = Math.min(100, Math.max(0, parseInt(progress_percentage) || 0));
      const goalId = await Goal.create(userId, { title, deadline, progress_percentage: progress });

      await Activity.log(req.session.userId, 'Create', 'Goals', `Created goal: "${title}" (${progress}% progress)`);

      return res.status(201).json({ success: true, message: 'Goal created successfully.', goalId });
    } catch (error) {
      console.error('Error creating goal:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update goal details
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const goalId = req.params.id;
      const { title, deadline, progress_percentage } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Goal title is required.' });
      }

      if (!deadline) {
        return res.status(400).json({ success: false, error: 'Goal target deadline date is required.' });
      }

      const progress = Math.min(100, Math.max(0, parseInt(progress_percentage) || 0));
      
      const originalGoal = await Goal.findById(userId, goalId);
      if (!originalGoal) {
        return res.status(404).json({ success: false, error: 'Goal not found.' });
      }

      const updated = await Goal.update(userId, goalId, { title, deadline, progress_percentage: progress });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update goal.' });
      }

      if (progress === 100 && originalGoal.progress_percentage !== 100) {
        await Activity.log(req.session.userId, 'Complete', 'Goals', `Achieved goal: "${title}"!`);
      } else {
        await Activity.log(req.session.userId, 'Update', 'Goals', `Updated progress/details for goal "${title}" to ${progress}%`);
      }

      return res.json({ success: true, message: 'Goal updated successfully.' });
    } catch (error) {
      console.error('Error updating goal:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Fast slider progress update
   */
  async updateProgress(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const goalId = req.params.id;
      const { progress_percentage } = req.body;

      if (progress_percentage === undefined || isNaN(progress_percentage)) {
        return res.status(400).json({ success: false, error: 'Valid progress percentage is required.' });
      }

      const progress = Math.min(100, Math.max(0, parseInt(progress_percentage)));
      
      const goal = await Goal.findById(userId, goalId);
      if (!goal) {
        return res.status(404).json({ success: false, error: 'Goal not found.' });
      }

      const updated = await Goal.updateProgress(userId, goalId, progress);
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update goal progress.' });
      }

      if (progress === 100 && goal.progress_percentage !== 100) {
        await Activity.log(req.session.userId, 'Complete', 'Goals', `Achieved goal: "${goal.title}"!`);
      } else {
        await Activity.log(req.session.userId, 'Update', 'Goals', `Adjusted goal progress for "${goal.title}" to ${progress}%`);
      }

      return res.json({ success: true, message: `Goal progress set to ${progress}%.` });
    } catch (error) {
      console.error('Error updating progress:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete goal
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const goalId = req.params.id;

      const goal = await Goal.findById(userId, goalId);
      if (!goal) {
        return res.status(404).json({ success: false, error: 'Goal not found.' });
      }

      const deleted = await Goal.delete(userId, goalId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete goal.' });
      }

      await Activity.log(req.session.userId, 'Delete', 'Goals', `Deleted goal: "${goal.title}"`);

      return res.json({ success: true, message: 'Goal deleted successfully.' });
    } catch (error) {
      console.error('Error deleting goal:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = goalController;
