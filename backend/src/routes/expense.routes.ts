import { Router } from 'express';
import {
  getAllExpenses,
  createExpense,
  getAllExpenseCategories,
  createExpenseCategory,
} from '../controllers/expense.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', getAllExpenses);
router.post('/', createExpense);
router.get('/categories', getAllExpenseCategories);
router.post('/categories', createExpenseCategory);

export default router;


