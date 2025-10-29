import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  getAllReturns, 
  getReturnById,
  createReturn,
  updateReturnStatus,
  completeReturn,
  deleteReturn
} from '../controllers/return.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllReturns);
router.get('/:id', getReturnById);
router.post('/', authorize('ADMIN', 'MANAGER'), createReturn);
router.put('/:id/status', authorize('ADMIN', 'MANAGER'), updateReturnStatus);
router.post('/:id/complete', authorize('ADMIN', 'MANAGER'), completeReturn);
router.delete('/:id', authorize('ADMIN'), deleteReturn);

export default router;
