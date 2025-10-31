import { Router } from 'express';
import { getMetrics } from '../controllers/metrics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('CORP_ADMIN', 'CORP_OPS'), getMetrics);

export default router;

