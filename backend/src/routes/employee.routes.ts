import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getEmployeePerformance } from '../controllers/employee.controller';

const router = Router();

router.use(authenticate);

// Performance (only for ADMIN and MANAGER)
router.get('/performance', authorize('ADMIN', 'MANAGER'), getEmployeePerformance);

export default router;

