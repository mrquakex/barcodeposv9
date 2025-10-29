import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllStockCounts,
  getStockCountById,
  startStockCount,
  updateStockCountItem,
  completeStockCount,
  cancelStockCount,
  deleteStockCount,
  createStockCount,
} from '../controllers/stockCount.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllStockCounts);
router.get('/:id', getStockCountById);
router.post('/start', startStockCount);
router.post('/:id/update-item', updateStockCountItem);
router.post('/:id/complete', completeStockCount);
router.post('/:id/cancel', cancelStockCount);
router.delete('/:id', deleteStockCount);
router.post('/', createStockCount); // Legacy endpoint for mobile

export default router;

