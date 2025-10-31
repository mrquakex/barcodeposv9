import { Router } from 'express';
import {
  generateTenantReport,
  generateLicenseReport,
  generateUserReport,
  generateFinancialReport,
  generateSystemReport,
  generateRevenueReport,
  generateUsageReport,
} from '../controllers/reports.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/tenants', requireRole('CORP_ADMIN', 'CORP_OPS'), generateTenantReport);
router.get('/licenses', requireRole('CORP_ADMIN', 'CORP_OPS'), generateLicenseReport);
router.get('/users', requireRole('CORP_ADMIN', 'CORP_OPS'), generateUserReport);
router.get('/financial', requireRole('CORP_ADMIN', 'CORP_OPS'), generateFinancialReport);
router.get('/system', requireRole('CORP_ADMIN', 'CORP_OPS'), generateSystemReport);
router.get('/revenue', requireRole('CORP_ADMIN', 'CORP_OPS'), generateRevenueReport);
router.get('/usage', requireRole('CORP_ADMIN', 'CORP_OPS'), generateUsageReport);

export default router;
