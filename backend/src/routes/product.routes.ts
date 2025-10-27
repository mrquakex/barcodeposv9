import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpsertProducts,
  getLowStockProducts,
  toggleFavorite,
  getFavoriteProducts,
  bulkImportProducts,
  resetAllStocksTo50,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/favorites', getFavoriteProducts); // 🌟 Favoriler
router.get('/:id', getProductById);
router.get('/barcode/:barcode', getProductByBarcode);
router.post('/', authorize('ADMIN', 'MANAGER'), createProduct);
router.post('/bulk-delete', authorize('ADMIN', 'MANAGER'), bulkDeleteProducts);
router.post('/bulk-upsert', authorize('ADMIN', 'MANAGER'), bulkUpsertProducts);
router.post('/bulk-import', authorize('ADMIN', 'MANAGER'), upload.single('file'), bulkImportProducts); // 📊 Excel Import
router.post('/reset-stocks-50', authorize('ADMIN'), resetAllStocksTo50); // 🔧 TEK SEFERLİK: Stokları 50'ye çek
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
router.put('/:id/toggle-favorite', toggleFavorite); // 🌟 Favori toggle (herkes kullanabilir)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteProduct);

export default router;


