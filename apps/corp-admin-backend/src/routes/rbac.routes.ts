import { Router } from 'express';
import { getPermissions, getRoleTemplates } from '../controllers/rbac.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/permissions', getPermissions);
router.get('/templates', requireRole('CORP_ADMIN'), getRoleTemplates);

export default router;

