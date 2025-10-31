import { Router } from 'express';
import { listUsers, getUser } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate); // All user routes require authentication

router.get('/', requireRole('CORP_ADMIN', 'CORP_OPS'), listUsers);
router.get('/:id', requireRole('CORP_ADMIN', 'CORP_OPS', 'CORP_SUPPORT'), getUser);

export default router;

