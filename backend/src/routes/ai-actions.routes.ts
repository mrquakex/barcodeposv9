import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCategoryAndMoveProducts,
  bulkUpdateProductPrices,
  bulkUpdateStocks,
  deleteInactiveProducts,
  deleteInvalidBarcodeProducts,
  generateChartData,
  naturalQuery,
  createProduct,
  deleteProduct,
  deleteCategory,
  createCustomer,
  deleteAbsurdPricedProducts,
} from '../controllers/ai-actions.controller';

const router = Router();

// 🤖 AI Actions - Sadece authenticated kullanıcılar erişebilir
router.post('/category-move', authenticate, createCategoryAndMoveProducts); // ✅ Kısaltılmış URL
router.post('/bulk-update-prices', authenticate, bulkUpdateProductPrices);
router.post('/bulk-update-stocks', authenticate, bulkUpdateStocks);
router.post('/delete-inactive', authenticate, deleteInactiveProducts);
router.post('/delete-invalid-barcodes', authenticate, deleteInvalidBarcodeProducts); // 🗑️ Geçersiz barkodları sil
router.post('/generate-chart', authenticate, generateChartData);
router.post('/natural-query', authenticate, naturalQuery); // 🔍 Doğal dil sorgusu

// 🆕 YENİ AI AKSİYONLARI - TAM YETKİ! 🚀
router.post('/create-product', authenticate, createProduct); // ➕ Ürün oluştur
router.post('/delete-product', authenticate, deleteProduct); // 🗑️ Ürün sil
router.post('/delete-category', authenticate, deleteCategory); // 🗑️ Kategori sil
router.post('/create-customer', authenticate, createCustomer); // ➕ Müşteri oluştur
router.post('/delete-absurd-priced', authenticate, deleteAbsurdPricedProducts); // 🗑️ Absürt fiyatlı ürünleri sil

export default router;

