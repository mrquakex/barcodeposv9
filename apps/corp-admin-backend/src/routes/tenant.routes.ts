import { Router } from 'express';
import { listTenants, getTenant, createTenant, updateTenant, deleteTenant } from '../controllers/tenant.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listTenants);
router.post('/', requireRole('CORP_ADMIN'), createTenant);
router.get('/:id', getTenant);
router.patch('/:id', requireRole('CORP_ADMIN'), updateTenant);
router.delete('/:id', requireRole('CORP_ADMIN'), deleteTenant);

export default router;

