import { Router } from 'express';
import { getRevenueAnalytics, getTenantAnalytics, getUserAnalytics } from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/revenue', requireRole('CORP_ADMIN', 'CORP_OPS'), getRevenueAnalytics);
router.get('/tenants', requireRole('CORP_ADMIN', 'CORP_OPS'), getTenantAnalytics);
router.get('/users', requireRole('CORP_ADMIN', 'CORP_OPS'), getUserAnalytics);

export default router;

