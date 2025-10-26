import { Router } from 'express';
import {
  getSalesPredictions,
  detectAnomalies,
  getStockRecommendations,
  getProductRecommendations,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Tüm AI endpoint'leri authentication gerektir
router.use(authenticate);

// Satış tahmini
router.get('/predictions/sales', getSalesPredictions);

// Anomali tespiti
router.get('/anomalies', detectAnomalies);

// Stok önerileri
router.get('/recommendations/stock', getStockRecommendations);

// Ürün önerileri
router.get('/recommendations/products', getProductRecommendations);

export default router;


