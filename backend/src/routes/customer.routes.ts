import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', authorize('ADMIN', 'MANAGER'), createCustomer);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateCustomer);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteCustomer);

export default router;


