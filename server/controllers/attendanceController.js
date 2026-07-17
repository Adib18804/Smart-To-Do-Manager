const Attendance = require('../models/attendanceModel');
const Activity = require('../models/activityModel');

const attendanceController = {
  /**
   * Get filtered attendance list
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { search, sortBy } = req.query;

      const attendance = await Attendance.getAll(userId, { search, sortBy });
      return res.json({ success: true, attendance });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get a single attendance record details
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const attendanceId = req.params.id;

      const record = await Attendance.findById(userId, attendanceId);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Attendance record not found.' });
      }
      return res.json({ success: true, attendance: record });
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Create a new attendance record
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { subject, date, status } = req.body;

      if (!subject || !subject.trim() || !date) {
        return res.status(400).json({ success: false, error: 'Subject and date are required.' });
      }

      const attendanceId = await Attendance.create(userId, { subject, date, status });

      // Log this action
      await Activity.log(userId, 'Create', 'Attendance', `Created attendance record for "${subject}"`);

      return res.status(201).json({ success: true, message: 'Attendance record created successfully.', attendanceId });
    } catch (error) {
      console.error('Error creating attendance record:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update an existing attendance record
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const attendanceId = req.params.id;
      const { subject, date, status } = req.body;

      if (!subject || !subject.trim() || !date) {
        return res.status(400).json({ success: false, error: 'Subject and date are required.' });
      }

      // Check if record exists
      const originalRecord = await Attendance.findById(userId, attendanceId);
      if (!originalRecord) {
        return res.status(404).json({ success: false, error: 'Attendance record not found.' });
      }

      const updated = await Attendance.update(userId, attendanceId, { subject, date, status });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update attendance record.' });
      }

      await Activity.log(userId, 'Update', 'Attendance', `Updated attendance record for "${subject}"`);

      return res.json({ success: true, message: 'Attendance record updated successfully.' });
    } catch (error) {
      console.error('Error updating attendance record:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete an attendance record
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const attendanceId = req.params.id;

      const record = await Attendance.findById(userId, attendanceId);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Attendance record not found.' });
      }

      const deleted = await Attendance.delete(userId, attendanceId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete attendance record.' });
      }

      await Activity.log(userId, 'Delete', 'Attendance', `Deleted attendance record for "${record.subject}"`);

      return res.json({ success: true, message: 'Attendance record deleted successfully.' });
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = attendanceController;
