const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', studyController.getAll);
router.get('/analytics', studyController.getAnalytics);
router.get('/:id', studyController.getOne);
router.post('/', studyController.create);
router.put('/:id', studyController.update);
router.delete('/:id', studyController.delete);

module.exports = router;
