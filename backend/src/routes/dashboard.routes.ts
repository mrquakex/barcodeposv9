import { Router } from 'express';
import { getDashboardStats, getRecentSales } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/recent-sales', getRecentSales);

export default router;

