import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getSmartPredictions,
  sendRealtimeAlert,
  executeNaturalQuery,
  createScheduledTask,
  exportReport,
  getRoleBasedContext,
  sendBulkMessage,
} from '../controllers/ai-advanced.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// 🔮 Smart Predictions
router.get('/predictions', getSmartPredictions);

// 🔔 Real-time Alerts
router.post('/alert', sendRealtimeAlert);

// 🔍 Natural Language Query
router.post('/query', executeNaturalQuery);

// ⏰ Scheduled Tasks
router.post('/schedule', createScheduledTask);

// 📄 Export Reports
router.post('/export', exportReport);

// 👥 Role-based Context
router.get('/role-context', getRoleBasedContext);

// 📱 Bulk Messaging
router.post('/send-message', sendBulkMessage);

export default router;

