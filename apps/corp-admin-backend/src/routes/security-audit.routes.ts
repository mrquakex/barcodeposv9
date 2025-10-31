import { Router } from 'express';
import {
  getSecurityEvents,
  getFailedLogins,
  getSuspiciousActivity,
} from '../controllers/security-audit.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN'));
router.get('/events', getSecurityEvents);
router.get('/failed-logins', getFailedLogins);
router.get('/suspicious', getSuspiciousActivity);

export default router;

