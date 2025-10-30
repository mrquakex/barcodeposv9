import { Router } from 'express';
import { listLicenses, createLicense, updateLicense } from '../controllers/license.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listLicenses);
router.post('/', requireRole('CORP_ADMIN'), createLicense);
router.patch('/:id', requireRole('CORP_ADMIN'), updateLicense);

export default router;

