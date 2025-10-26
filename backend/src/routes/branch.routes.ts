import { Router } from 'express';
import { getAllBranches, createBranch, updateBranch } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);

export default router;


