import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllStockCounts, getStockCountById, createStockCount } from '../controllers/stockCount.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllStockCounts);
router.get('/:id', getStockCountById);
router.post('/', createStockCount);

export default router;

