import { Router } from 'express';
import { listAdmins, createAdmin, updateAdmin, deleteAdmin } from '../controllers/admin-management.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN'));

router.get('/', listAdmins);
router.post('/', createAdmin);
router.patch('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
