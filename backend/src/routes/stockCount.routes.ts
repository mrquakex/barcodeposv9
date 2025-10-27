import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllStockCounts, getStockCountById } from '../controllers/stockCount.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllStockCounts);
router.get('/:id', getStockCountById);

export default router;

