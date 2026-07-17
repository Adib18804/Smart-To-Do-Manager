const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', attendanceController.getAll);
router.get('/:id', attendanceController.getOne);
router.post('/', attendanceController.create);
router.put('/:id', attendanceController.update);
router.delete('/:id', attendanceController.delete);

module.exports = router;
