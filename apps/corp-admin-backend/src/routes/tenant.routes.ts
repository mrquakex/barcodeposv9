import { Router } from 'express';
import { listTenants, getTenant, updateTenant } from '../controllers/tenant.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listTenants);
router.get('/:id', getTenant);
router.patch('/:id', requireRole('CORP_ADMIN'), updateTenant);

export default router;

