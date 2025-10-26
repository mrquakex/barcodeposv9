import { Router } from 'express';
import { getStockMovements, createStockMovement } from '../controllers/stock.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/movements', getStockMovements);
router.post('/movements', authorize('ADMIN', 'MANAGER'), createStockMovement);

export default router;


