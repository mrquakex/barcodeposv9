import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllReturns, getReturnById } from '../controllers/return.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllReturns);
router.get('/:id', getReturnById);

export default router;

