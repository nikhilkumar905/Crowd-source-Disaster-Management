import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createDisasterReport, listDisasterReports, updateDisasterStatus, broadcastAlert, volunteerRespondToDisaster, volunteerCheckInDisaster } from '../controllers/disasterController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  }
});

router.get('/', protect, listDisasterReports);
router.post('/', protect, requireRole('Citizen', 'Admin'), upload.single('image'), createDisasterReport);
router.patch('/:id/status', protect, requireRole('Admin'), updateDisasterStatus);
router.post('/:id/broadcast', protect, requireRole('Admin'), broadcastAlert);
router.post('/:id/respond', protect, requireRole('Volunteer'), volunteerRespondToDisaster);
router.post('/:id/checkin', protect, requireRole('Volunteer'), volunteerCheckInDisaster);

export default router;

