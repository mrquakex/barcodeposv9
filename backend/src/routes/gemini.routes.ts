import { Router } from 'express';
import {
  chatWithAI,
  getBusinessInsights,
  getSuggestedProducts,
} from '../controllers/gemini.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// AI Chat
router.post('/chat', chatWithAI);

// İş Önerileri
router.get('/insights', getBusinessInsights);

// Ürün Önerileri
router.get('/product-suggestions', getSuggestedProducts);

export default router;

