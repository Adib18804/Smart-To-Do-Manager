const Task = require('../models/taskModel');
const Activity = require('../models/activityModel');

const taskController = {
  /**
   * Get filtered tasks list
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { search, status, priority, sortBy } = req.query;
      
      const tasks = await Task.getAll(userId, { search, status, priority, sortBy });
      return res.json({ success: true, tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get a single task details
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const taskId = req.params.id;
      
      const task = await Task.findById(userId, taskId);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }
      return res.json({ success: true, task });
    } catch (error) {
      console.error('Error fetching task:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Create a new task
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { title, description, priority, status, deadline } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Task title is required.' });
      }

      const taskId = await Task.create(userId, { title, description, priority, status, deadline });
      
      // Log this action
      await Activity.log(req.session.userId, 'Create', 'Tasks', `Created task: "${title}"`);

      return res.status(201).json({ success: true, message: 'Task created successfully.', taskId });
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update an existing task
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const taskId = req.params.id;
      const { title, description, priority, status, deadline } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Task title is required.' });
      }

      // Check if task exists and get original status
      const originalTask = await Task.findById(userId, taskId);
      if (!originalTask) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }

      const updated = await Task.update(userId, taskId, { title, description, priority, status, deadline });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update task.' });
      }

      // Trigger different log types depending on whether the task status was set to Completed
      if (status === 'Completed' && originalTask.status !== 'Completed') {
        await Activity.log(req.session.userId, 'Complete', 'Tasks', `Completed task: "${title}"`);
      } else {
        await Activity.log(req.session.userId, 'Update', 'Tasks', `Updated task details for: "${title}"`);
      }

      return res.json({ success: true, message: 'Task updated successfully.' });
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Fast status-only patch (e.g. toggle completion checkbox)
   */
  async toggleStatus(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const taskId = req.params.id;
      const { status } = req.body;

      if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status value.' });
      }

      const task = await Task.findById(userId, taskId);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }

      const updated = await Task.updateStatus(userId, taskId, status);
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update task status.' });
      }

      const logAction = status === 'Completed' ? 'Complete' : 'Update';
      await Activity.log(req.session.userId, logAction, 'Tasks', `Marked task "${task.title}" as ${status}`);

      return res.json({ success: true, message: `Task marked as ${status}.` });
    } catch (error) {
      console.error('Error toggling status:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete a task
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const taskId = req.params.id;

      const task = await Task.findById(userId, taskId);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }

      const deleted = await Task.delete(userId, taskId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete task.' });
      }

      await Activity.log(req.session.userId, 'Delete', 'Tasks', `Deleted task: "${task.title}"`);

      return res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = taskController;
