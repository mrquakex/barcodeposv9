import { Router } from 'express';
import { getAllActivityLogs } from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllActivityLogs);

export default router;


