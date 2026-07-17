const Note = require('../models/noteModel');
const Activity = require('../models/activityModel');

const noteController = {
  /**
   * Get filtered notes list
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { search, sortBy } = req.query;

      const notes = await Note.getAll(userId, { search, sortBy });
      return res.json({ success: true, notes });
    } catch (error) {
      console.error('Error fetching notes:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get a single note details
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const noteId = req.params.id;

      const note = await Note.findById(userId, noteId);
      if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found.' });
      }
      return res.json({ success: true, note });
    } catch (error) {
      console.error('Error fetching note:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Create a new note
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { title, content } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Note title is required.' });
      }

      const noteId = await Note.create(userId, { title, content });

      // Log this action
      await Activity.log(userId, 'Create', 'Notes', `Created note: "${title}"`);

      return res.status(201).json({ success: true, message: 'Note created successfully.', noteId });
    } catch (error) {
      console.error('Error creating note:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update an existing note
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const noteId = req.params.id;
      const { title, content } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Note title is required.' });
      }

      // Check if note exists
      const originalNote = await Note.findById(userId, noteId);
      if (!originalNote) {
        return res.status(404).json({ success: false, error: 'Note not found.' });
      }

      const updated = await Note.update(userId, noteId, { title, content });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update note.' });
      }

      await Activity.log(userId, 'Update', 'Notes', `Updated note: "${title}"`);

      return res.json({ success: true, message: 'Note updated successfully.' });
    } catch (error) {
      console.error('Error updating note:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete a note
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const noteId = req.params.id;

      const note = await Note.findById(userId, noteId);
      if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found.' });
      }

      const deleted = await Note.delete(userId, noteId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete note.' });
      }

      await Activity.log(userId, 'Delete', 'Notes', `Deleted note: "${note.title}"`);

      return res.json({ success: true, message: 'Note deleted successfully.' });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = noteController;
