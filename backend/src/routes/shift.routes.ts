import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllShifts, getActiveShift, getShiftById, startShift, endShift } from '../controllers/shift.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllShifts);
router.get('/active', getActiveShift);
router.get('/:id', getShiftById);
router.post('/start', startShift);
router.post('/:id/end', endShift);

export default router;

