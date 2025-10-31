import { Router } from 'express';
import { getSystemHealth, getDatabaseHealth } from '../controllers/system-health.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN', 'CORP_OPS'));
router.get('/', getSystemHealth);
router.get('/database', getDatabaseHealth);

export default router;

