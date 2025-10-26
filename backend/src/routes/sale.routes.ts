import { Router } from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  deleteSale,
} from '../controllers/sale.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteSale);

export default router;


