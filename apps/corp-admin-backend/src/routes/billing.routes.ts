import { Router } from 'express';
import { getInvoices, createInvoice, getPayments } from '../controllers/billing.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/invoices', requireRole('CORP_ADMIN', 'CORP_OPS'), getInvoices);
router.post('/invoices', requireRole('CORP_ADMIN'), createInvoice);
router.get('/payments', requireRole('CORP_ADMIN', 'CORP_OPS'), getPayments);

export default router;

