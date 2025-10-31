import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN'));

router.get('/', getSettings);
router.get('/:category', getSettings);
router.patch('/:category', updateSettings);

export default router;

