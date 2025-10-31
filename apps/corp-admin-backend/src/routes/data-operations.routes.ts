import { Router } from 'express';
import multer from 'multer';
import { exportData, importData, getBackupStatus } from '../controllers/data-operations.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN'));

router.get('/export', exportData);
router.post('/import', upload.single('file'), importData);
router.get('/backup/status', getBackupStatus);

export default router;

