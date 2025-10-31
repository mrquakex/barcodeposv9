import { Router } from 'express';
import { exportTenants, exportLicenses, exportUsers, exportAuditLogs } from '../controllers/export.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/tenants', requireRole('CORP_ADMIN', 'CORP_OPS'), exportTenants);
router.get('/licenses', requireRole('CORP_ADMIN', 'CORP_OPS'), exportLicenses);
router.get('/users', requireRole('CORP_ADMIN', 'CORP_OPS'), exportUsers);
router.get('/audit-logs', requireRole('CORP_ADMIN'), exportAuditLogs);

export default router;

