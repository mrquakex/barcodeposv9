import { Router } from 'express';
import multer from 'multer';
import {
  getDashboardStats,
  getStockAlerts,
  getABCAnalysis,
  getAgingReport,
  getTurnoverRate,
  importProductsFromExcel,
  exportProductsToExcel,
  bulkUpdateStock,
  bulkUpdatePrices
} from '../controllers/stock.controller';
import { advancedExport, emailReport } from '../controllers/advancedExport.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 📊 Dashboard
router.get('/dashboard-stats', authenticate, getDashboardStats);

// ⚠️ Uyarılar
router.get('/alerts', authenticate, getStockAlerts);

// 📈 Raporlar
router.get('/abc-analysis', authenticate, getABCAnalysis);
router.get('/aging-report', authenticate, getAgingReport);
router.get('/turnover-rate', authenticate, getTurnoverRate);

// 📥📤 Excel İşlemleri
router.post('/import-excel', authenticate, upload.single('file'), importProductsFromExcel);
router.get('/export-excel', authenticate, exportProductsToExcel);

// ⚡ Toplu İşlemler
router.post('/bulk-update', authenticate, bulkUpdateStock);
router.post('/bulk-update-prices', authenticate, bulkUpdatePrices);

// 📊 Gelişmiş Export
router.get('/advanced-export', authenticate, advancedExport);
router.post('/email-report', authenticate, emailReport);

export default router;
