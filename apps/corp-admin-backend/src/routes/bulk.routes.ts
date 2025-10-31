import { Router } from 'express';
import {
  bulkDeleteTenants,
  bulkUpdateTenants,
  bulkDeleteLicenses,
  bulkDeleteUsers,
} from '../controllers/bulk.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN'));

router.post('/tenants/delete', bulkDeleteTenants);
router.post('/tenants/update', bulkUpdateTenants);
router.post('/licenses/delete', bulkDeleteLicenses);
router.post('/users/delete', bulkDeleteUsers);

export default router;

