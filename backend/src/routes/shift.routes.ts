import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllShifts, getShiftById } from '../controllers/shift.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAllShifts);
router.get('/:id', getShiftById);

export default router;

