import { Router } from 'express';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
} from '../controllers/webhooks.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('CORP_ADMIN', 'CORP_OPS'));
router.get('/', getWebhooks);
router.post('/', createWebhook);
router.patch('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/test', testWebhook);

export default router;

