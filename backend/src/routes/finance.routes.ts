import { Router } from 'express';
import { getFinancialSummary, getCashFlow } from '../controllers/finance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/summary', getFinancialSummary);
router.get('/cash-flow', getCashFlow);

export default router;

