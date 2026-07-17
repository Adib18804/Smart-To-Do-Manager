const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', noteController.getAll);
router.get('/:id', noteController.getOne);
router.post('/', noteController.create);
router.put('/:id', noteController.update);
router.delete('/:id', noteController.delete);

module.exports = router;
