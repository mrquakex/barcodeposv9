import { Router } from 'express';
import { getAPIKeys, createAPIKey, deleteAPIKey } from '../controllers/api-keys.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN'));
router.get('/', getAPIKeys);
router.post('/', createAPIKey);
router.delete('/:id', deleteAPIKey);

export default router;

