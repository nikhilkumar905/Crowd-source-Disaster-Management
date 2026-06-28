import express from 'express';
import {
  adminSetPriority,
  createResourceRequest,
  listResourceRequests,
  updateRequestStatus,
  volunteerAcceptRequest,
  citizenVerifyRequest
} from '../controllers/requestController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, listResourceRequests);
router.post('/', protect, requireRole('Citizen', 'Admin'), createResourceRequest);

router.post('/:id/accept', protect, requireRole('Volunteer'), volunteerAcceptRequest);
router.patch('/:id/status', protect, requireRole('Volunteer', 'Admin'), updateRequestStatus);
router.patch('/:id/verify', protect, requireRole('Citizen'), citizenVerifyRequest);
router.patch('/:id/priority', protect, requireRole('Admin'), adminSetPriority);

export default router;
