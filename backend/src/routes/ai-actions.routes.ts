import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCategoryAndMoveProducts,
  bulkUpdateProductPrices,
  bulkUpdateStocks,
  deleteInactiveProducts,
} from '../controllers/ai-actions.controller';

const router = Router();

// 🤖 AI Actions - Sadece authenticated kullanıcılar erişebilir
router.post('/category-and-move', authenticate, createCategoryAndMoveProducts);
router.post('/bulk-update-prices', authenticate, bulkUpdateProductPrices);
router.post('/bulk-update-stocks', authenticate, bulkUpdateStocks);
router.post('/delete-inactive', authenticate, deleteInactiveProducts);

export default router;

