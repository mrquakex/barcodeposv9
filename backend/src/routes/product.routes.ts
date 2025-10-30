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
  getProductMovements,
  getProductSales,
  getProductPurchaseHistory,
  getProductVariants,
  getProductImages,
  getProductDocuments,
  addProductStock,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/favorites', getFavoriteProducts); // 🌟 Favoriler
router.get('/barcode/:barcode', getProductByBarcode); // ⚠️ Specific routes before :id
router.get('/:id', getProductById);
router.get('/:id/movements', getProductMovements); // 📊 Product Detail: Stock Movements
router.get('/:id/sales', getProductSales); // 📊 Product Detail: Sales History
router.get('/:id/purchase-history', getProductPurchaseHistory); // 📊 Product Detail: Purchase History
router.get('/:id/variants', getProductVariants); // 📊 Product Detail: Variants
router.get('/:id/images', getProductImages); // 📊 Product Detail: Images
router.get('/:id/documents', getProductDocuments); // 📊 Product Detail: Documents
router.post('/', authorize('ADMIN', 'MANAGER'), createProduct);
router.post('/:id/add-stock', authorize('ADMIN', 'MANAGER'), addProductStock); // 📊 Product Detail: Add Stock
router.post('/bulk-delete', authorize('ADMIN', 'MANAGER'), bulkDeleteProducts);
router.post('/bulk-upsert', authorize('ADMIN', 'MANAGER'), bulkUpsertProducts);
router.post('/bulk-import', authorize('ADMIN', 'MANAGER'), upload.single('file'), bulkImportProducts); // 📊 Excel Import
router.post('/reset-stocks-50', authorize('ADMIN'), resetAllStocksTo50); // 🔧 TEK SEFERLİK: Stokları 50'ye çek
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
router.put('/:id/toggle-favorite', toggleFavorite); // 🌟 Favori toggle (herkes kullanabilir)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteProduct);

export default router;


