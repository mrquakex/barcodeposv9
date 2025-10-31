import { Router } from 'express';
import { 
  listIntegrations, 
  createIntegration, 
  updateIntegration, 
  deleteIntegration,
  setupSSO,
  testIntegration,
} from '../controllers/integrations.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('CORP_ADMIN', 'CORP_OPS'), listIntegrations);
router.post('/', requireRole('CORP_ADMIN'), createIntegration);
router.patch('/:id', requireRole('CORP_ADMIN'), updateIntegration);
router.delete('/:id', requireRole('CORP_ADMIN'), deleteIntegration);
router.post('/sso/setup', requireRole('CORP_ADMIN'), setupSSO);
router.post('/:id/test', requireRole('CORP_ADMIN', 'CORP_OPS'), testIntegration);

export default router;

