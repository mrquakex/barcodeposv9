import { Router } from 'express';
import {
  getSalesReport,
  getProductPerformanceReport,
  getCustomerAnalyticsReport,
  getFinancialReport,
  getInventoryReport,
  exportReport,
} from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Sales Report
router.get('/sales', authorize('ADMIN', 'MANAGER'), getSalesReport);

// Product Performance Report
router.get('/products', authorize('ADMIN', 'MANAGER'), getProductPerformanceReport);

// Customer Analytics Report
router.get('/customers', authorize('ADMIN', 'MANAGER'), getCustomerAnalyticsReport);

// Financial Report
router.get('/financial', authorize('ADMIN', 'MANAGER'), getFinancialReport);

// Inventory Report
router.get('/inventory', authorize('ADMIN', 'MANAGER'), getInventoryReport);

// Export Report (Excel/PDF)
router.post('/export', authorize('ADMIN', 'MANAGER'), exportReport);

export default router;


