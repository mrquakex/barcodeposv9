import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  getAllInvoices, 
  getInvoiceById, 
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  sendToGIB
} from '../controllers/invoice.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', authorize(['ADMIN', 'MANAGER']), createInvoice);
router.put('/:id/status', authorize(['ADMIN', 'MANAGER']), updateInvoiceStatus);
router.delete('/:id', authorize(['ADMIN']), deleteInvoice);
router.post('/:id/send-to-gib', authorize(['ADMIN', 'MANAGER']), sendToGIB);

export default router;
