import express from 'express';
import { deleteUser, getMe, listUsers, updateUserRole, updateAvailability, updateSkills } from '../controllers/userController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/me/availability', protect, requireRole('Volunteer'), updateAvailability);
router.put('/me/skills', protect, requireRole('Volunteer'), updateSkills);

router.get('/', protect, requireRole('Admin'), listUsers);
router.patch('/:id/role', protect, requireRole('Admin'), updateUserRole);
router.delete('/:id', protect, requireRole('Admin'), deleteUser);

export default router;

