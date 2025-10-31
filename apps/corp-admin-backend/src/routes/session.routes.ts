import { Router } from 'express';
import { getMySessions, logoutAllSessions, revokeSession } from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getMySessions);
router.post('/logout-all', logoutAllSessions);
router.post('/revoke', revokeSession);

export default router;

