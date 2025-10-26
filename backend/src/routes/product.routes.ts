import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProductById);
router.get('/barcode/:barcode', getProductByBarcode);
router.post('/', authorize('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteProduct);

export default router;


