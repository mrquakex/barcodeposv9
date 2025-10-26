import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permissions.middleware';
import {
  getPriceChanges,
  applyPriceChange,
  ignorePriceChange,
  applyMultiplePriceChanges,
  runManualScraping,
  getScraperConfig,
  updateScraperConfig,
  getPriceChangeStats,
} from '../controllers/price-monitor.controller';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authMiddleware);

// 📊 Fiyat değişikliklerini listele
router.get('/changes', getPriceChanges);

// 📊 Fiyat değişiklik istatistikleri
router.get('/stats', getPriceChangeStats);

// 🎯 Tek fiyat değişikliğini uygula
router.post('/changes/:id/apply', checkPermission(['ADMIN', 'MANAGER']), applyPriceChange);

// ❌ Tek fiyat değişikliğini yoksay
router.post('/changes/:id/ignore', checkPermission(['ADMIN', 'MANAGER']), ignorePriceChange);

// 🔄 Toplu fiyat değişikliği uygula
router.post('/changes/apply-multiple', checkPermission(['ADMIN', 'MANAGER']), applyMultiplePriceChanges);

// 🕷️ Manuel scraping başlat (ADMIN ve MANAGER)
router.post('/scrape', checkPermission(['ADMIN', 'MANAGER']), runManualScraping);

// ⚙️ Scraper ayarlarını getir
router.get('/config', checkPermission(['ADMIN']), getScraperConfig);

// ⚙️ Scraper ayarlarını güncelle
router.put('/config', checkPermission(['ADMIN']), updateScraperConfig);

export default router;

