const StudySession = require('../models/studyModel');
const Activity = require('../models/activityModel');

const studyController = {
  /**
   * Get all study sessions
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const sessions = await StudySession.getAll(userId);
      return res.json({ success: true, sessions });
    } catch (error) {
      console.error('Error fetching study sessions:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get detail for single study session
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const sessionId = req.params.id;

      const session = await StudySession.findById(userId, sessionId);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Study session not found.' });
      }
      return res.json({ success: true, session });
    } catch (error) {
      console.error('Error fetching study session:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Log a new study session
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { subject_name, study_date, duration_hours, notes } = req.body;

      if (!subject_name || !subject_name.trim()) {
        return res.status(400).json({ success: false, error: 'Subject name is required.' });
      }

      if (!study_date) {
        return res.status(400).json({ success: false, error: 'Study date is required.' });
      }

      if (!duration_hours || isNaN(duration_hours) || parseFloat(duration_hours) <= 0) {
        return res.status(400).json({ success: false, error: 'Valid study duration (hours) is required.' });
      }

      const sessionId = await StudySession.create(userId, { subject_name, study_date, duration_hours, notes });

      await Activity.log(req.session.userId, 'Create', 'Study Planner', `Studied "${subject_name}" for ${duration_hours} hours`);

      return res.status(201).json({ success: true, message: 'Study session logged successfully.', sessionId });
    } catch (error) {
      console.error('Error logging study session:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update study session logs
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const sessionId = req.params.id;
      const { subject_name, study_date, duration_hours, notes } = req.body;

      if (!subject_name || !subject_name.trim()) {
        return res.status(400).json({ success: false, error: 'Subject name is required.' });
      }

      if (!study_date) {
        return res.status(400).json({ success: false, error: 'Study date is required.' });
      }

      if (!duration_hours || isNaN(duration_hours) || parseFloat(duration_hours) <= 0) {
        return res.status(400).json({ success: false, error: 'Valid study duration (hours) is required.' });
      }

      const originalSession = await StudySession.findById(userId, sessionId);
      if (!originalSession) {
        return res.status(404).json({ success: false, error: 'Study session not found.' });
      }

      const updated = await StudySession.update(userId, sessionId, { subject_name, study_date, duration_hours, notes });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update study session.' });
      }

      await Activity.log(req.session.userId, 'Update', 'Study Planner', `Updated session for "${subject_name}" (${duration_hours} hrs)`);

      return res.json({ success: true, message: 'Study session updated successfully.' });
    } catch (error) {
      console.error('Error updating study session:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete study session log
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const sessionId = req.params.id;

      const session = await StudySession.findById(userId, sessionId);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Study session not found.' });
      }

      const deleted = await StudySession.delete(userId, sessionId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete study session.' });
      }

      await Activity.log(req.session.userId, 'Delete', 'Study Planner', `Deleted study session for "${session.subject_name}" (${session.duration_hours} hrs)`);

      return res.json({ success: true, message: 'Study session deleted successfully.' });
    } catch (error) {
      console.error('Error deleting study session:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get aggregate study session statistics for charts
   */
  async getAnalytics(req, res) {
    try {
      const userId = req.userId || req.session.userId;

      const totalHours = await StudySession.getTotalHours(userId);
      const weeklyStats = await StudySession.getWeeklyStats(userId);
      const subjectStats = await StudySession.getSubjectStats(userId);

      return res.json({
        success: true,
        analytics: {
          totalHours,
          weeklyStats,
          subjectStats
        }
      });
    } catch (error) {
      console.error('Error fetching study analytics:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = studyController;
