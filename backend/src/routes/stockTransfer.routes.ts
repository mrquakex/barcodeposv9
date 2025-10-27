import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllStockTransfers, getStockTransferById } from '../controllers/stockTransfer.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllStockTransfers);
router.get('/:id', getStockTransferById);

export default router;

