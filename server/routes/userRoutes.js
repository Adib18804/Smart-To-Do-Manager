const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/', userController.getAll);
router.get('/:id', userController.getOne);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
