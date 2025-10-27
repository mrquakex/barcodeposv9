import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllPurchaseOrders, getPurchaseOrderById } from '../controllers/purchaseOrder.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllPurchaseOrders);
router.get('/:id', getPurchaseOrderById);

export default router;

