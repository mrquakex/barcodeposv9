import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', authorize('ADMIN', 'MANAGER'), createCategory);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateCategory);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteCategory);

export default router;

