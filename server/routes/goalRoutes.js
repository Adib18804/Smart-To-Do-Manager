const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', goalController.getAll);
router.get('/:id', goalController.getOne);
router.post('/', goalController.create);
router.put('/:id', goalController.update);
router.patch('/:id/progress', goalController.updateProgress);
router.delete('/:id', goalController.delete);

module.exports = router;
