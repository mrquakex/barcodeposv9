import { Router } from 'express';
import { 
  getHistoricalData, 
  getPredictiveAnalytics, 
  getCustomDashboard,
  saveCustomDashboard 
} from '../controllers/advanced-analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/historical', requireRole('CORP_ADMIN', 'CORP_OPS'), getHistoricalData);
router.get('/predictive', requireRole('CORP_ADMIN', 'CORP_OPS'), getPredictiveAnalytics);
router.get('/dashboard/custom', getCustomDashboard);
router.post('/dashboard/custom', saveCustomDashboard);

export default router;

