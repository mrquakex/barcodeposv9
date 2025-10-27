import { Router } from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  deleteSale,
  getSaleByReceipt,
  searchSales,
  processSaleReturn,
} from '../controllers/sale.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllSales);
router.get('/search', searchSales); // 💠 ENTERPRISE: Search sales by date
router.get('/receipt/:receiptNumber', getSaleByReceipt); // 💠 ENTERPRISE: Get sale by receipt
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/return', processSaleReturn); // 💠 ENTERPRISE: Process return/refund
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteSale);

export default router;



router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteSale);

export default router;



router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteSale);

export default router;


