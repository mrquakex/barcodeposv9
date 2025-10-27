import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllInvoices, getInvoiceById } from '../controllers/invoice.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);

export default router;

