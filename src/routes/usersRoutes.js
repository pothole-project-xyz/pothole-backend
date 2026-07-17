const express = require('express');
const router = express.Router();

const usersController = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/', usersController.listUsers);
router.patch('/:id/status', usersController.updateUserStatus);
router.patch('/:id/role', usersController.updateUserRole);

module.exports = router;
