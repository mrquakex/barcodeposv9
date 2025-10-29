import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  getAllPurchaseOrders, 
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  deletePurchaseOrder
} from '../controllers/purchaseOrder.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', authorize(['ADMIN', 'MANAGER']), createPurchaseOrder);
router.put('/:id/status', authorize(['ADMIN', 'MANAGER']), updatePurchaseOrderStatus);
router.post('/:id/receive', authorize(['ADMIN', 'MANAGER']), receivePurchaseOrder);
router.delete('/:id', authorize(['ADMIN']), deletePurchaseOrder);

export default router;
