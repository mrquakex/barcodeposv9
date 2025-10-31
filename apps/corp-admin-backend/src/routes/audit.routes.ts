import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate); // All audit routes require authentication

router.get('/', requireRole('CORP_ADMIN', 'CORP_OPS'), listAuditLogs);

export default router;

