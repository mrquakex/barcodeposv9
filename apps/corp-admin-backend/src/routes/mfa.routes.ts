import { Router } from 'express';
import { setupMFA, verifyMFA, disableMFA } from '../controllers/mfa.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/setup', setupMFA);
router.post('/verify', verifyMFA);
router.post('/disable', disableMFA);

export default router;

