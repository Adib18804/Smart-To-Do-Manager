const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', expenseController.getAll);
router.get('/analytics', expenseController.getAnalytics);
router.get('/:id', expenseController.getOne);
router.post('/', expenseController.create);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.delete);

module.exports = router;
