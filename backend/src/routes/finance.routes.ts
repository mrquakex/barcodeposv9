import { Router } from 'express';
import { getFinancialSummary, getCashFlow, getProfitLoss, getProfitLossChart } from '../controllers/finance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/summary', getFinancialSummary);
router.get('/cash-flow', getCashFlow);
router.get('/profit-loss', getProfitLoss);
router.get('/profit-loss-chart', getProfitLossChart);

export default router;


