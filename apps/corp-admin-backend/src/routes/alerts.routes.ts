import { Router } from 'express';
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../controllers/alerts.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getAlerts);
router.post('/', requireRole('CORP_ADMIN', 'CORP_OPS'), createAlert);
router.patch('/:id', requireRole('CORP_ADMIN', 'CORP_OPS'), updateAlert);
router.delete('/:id', requireRole('CORP_ADMIN'), deleteAlert);

export default router;

