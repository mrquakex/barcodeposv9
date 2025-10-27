import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getStockMovements, createStockMovement } from '../controllers/stock.controller';

const router = Router();

router.use(authenticate);
router.get('/', getStockMovements);
router.post('/', createStockMovement);

export default router;

