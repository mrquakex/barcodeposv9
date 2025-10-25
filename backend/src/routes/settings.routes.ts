import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorize('ADMIN', 'MANAGER'), updateSettings);

export default router;

