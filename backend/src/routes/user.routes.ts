import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/password', updatePassword);
router.delete('/:id', deleteUser);

export default router;

