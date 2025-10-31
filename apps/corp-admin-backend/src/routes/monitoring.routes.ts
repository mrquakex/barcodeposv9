import { Router } from 'express';
import { getMonitoringData, getErrorStats } from '../controllers/monitoring.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('CORP_ADMIN', 'CORP_OPS'), getMonitoringData);
router.get('/errors', requireRole('CORP_ADMIN', 'CORP_OPS'), getErrorStats);

export default router;

