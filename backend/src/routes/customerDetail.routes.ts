import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getCustomerDetail,
  addDebt,
  addPayment,
  getTransactions,
  addNote,
  getNotes,
  deleteNote,
  deleteDebt,
  getFinancialSummary,
} from '../controllers/customerDetail.controller';

const router = Router();

router.use(authenticate);

// Müşteri Detayı
router.get('/:id/detail', getCustomerDetail);

// Finansal
router.post('/:id/debt', authorize('ADMIN', 'MANAGER'), addDebt);
router.delete('/:id/debts/:debtId', authorize('ADMIN', 'MANAGER'), deleteDebt);
router.post('/:id/payment', authorize('ADMIN', 'MANAGER'), addPayment);
router.get('/:id/transactions', getTransactions);
router.get('/:id/financial-summary', getFinancialSummary);

// Notlar
router.get('/:id/notes', getNotes);
router.post('/:id/notes', addNote);
router.delete('/:id/notes/:noteId', deleteNote);

export default router;

