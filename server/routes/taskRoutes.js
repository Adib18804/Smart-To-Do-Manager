const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', taskController.getAll);
router.get('/:id', taskController.getOne);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.patch('/:id/status', taskController.toggleStatus);
router.delete('/:id', taskController.delete);

module.exports = router;
