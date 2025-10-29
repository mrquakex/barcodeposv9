import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  getCashTransactions, 
  addCashTransaction, 
  getCurrentCashBalance,
  deleteCashTransaction,
} from '../controllers/cashTransaction.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCashTransactions);
router.get('/balance', getCurrentCashBalance);
router.post('/', addCashTransaction);
router.delete('/:id', deleteCashTransaction);

export default router;

