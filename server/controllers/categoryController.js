const Category = require('../models/categoryModel');
const Activity = require('../models/activityModel');

const categoryController = {
  /**
   * Get all categories
   */
  async getAll(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const categories = await Category.getAll(userId);
      return res.json({ success: true, categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get a single category details
   */
  async getOne(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const categoryId = req.params.id;

      const category = await Category.findById(userId, categoryId);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }
      return res.json({ success: true, category });
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Create a new category
   */
  async create(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const { name, color } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Category name is required.' });
      }

      // Check for duplicate category name
      const existing = await Category.findByName(userId, name.trim());
      if (existing) {
        return res.status(400).json({ success: false, error: 'Category with this name already exists.' });
      }

      const categoryId = await Category.create(userId, { name: name.trim(), color });

      // Log this action
      await Activity.log(userId, 'Create', 'Categories', `Created category: "${name}"`);

      return res.status(201).json({ success: true, message: 'Category created successfully.', categoryId });
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update an existing category
   */
  async update(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const categoryId = req.params.id;
      const { name, color } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Category name is required.' });
      }

      // Check if category exists
      const originalCategory = await Category.findById(userId, categoryId);
      if (!originalCategory) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }

      // Check for duplicate category name
      const existing = await Category.findByName(userId, name.trim());
      if (existing && existing.category_id !== parseInt(categoryId)) {
        return res.status(400).json({ success: false, error: 'Category with this name already exists.' });
      }

      const updated = await Category.update(userId, categoryId, { name: name.trim(), color });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update category.' });
      }

      await Activity.log(userId, 'Update', 'Categories', `Updated category: "${name}"`);

      return res.json({ success: true, message: 'Category updated successfully.' });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete a category
   */
  async delete(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const categoryId = req.params.id;

      const category = await Category.findById(userId, categoryId);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }

      const deleted = await Category.delete(userId, categoryId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete category.' });
      }

      await Activity.log(userId, 'Delete', 'Categories', `Deleted category: "${category.name}"`);

      return res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = categoryController;
