import { Router } from 'express';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate); // All user routes require authentication

router.get('/', requireRole('CORP_ADMIN', 'CORP_OPS'), listUsers);
router.post('/', requireRole('CORP_ADMIN'), createUser);
router.get('/:id', requireRole('CORP_ADMIN', 'CORP_OPS', 'CORP_SUPPORT'), getUser);
router.patch('/:id', requireRole('CORP_ADMIN'), updateUser);
router.delete('/:id', requireRole('CORP_ADMIN'), deleteUser);

export default router;

