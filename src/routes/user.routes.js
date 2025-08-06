const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Suspend user
router.patch('/:id/suspend', userController.suspendUser);

// Activate user
router.patch('/:id/activate', userController.activateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
