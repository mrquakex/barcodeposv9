import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from './lib/rate-limit.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import licenseRoutes from './routes/license.routes.js';
import usersRoutes from './routes/users.routes.js';
import auditRoutes from './routes/audit.routes.js';
import exportRoutes from './routes/export.routes.js';
import bulkRoutes from './routes/bulk.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import mfaRoutes from './routes/mfa.routes.js';
import sessionRoutes from './routes/session.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import billingRoutes from './routes/billing.routes.js';
import apiKeysRoutes from './routes/api-keys.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import securityAuditRoutes from './routes/security-audit.routes.js';
import systemHealthRoutes from './routes/system-health.routes.js';
import rbacRoutes from './routes/rbac.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import adminManagementRoutes from './routes/admin-management.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import dataOperationsRoutes from './routes/data-operations.routes.js';
import advancedAnalyticsRoutes from './routes/advanced-analytics.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import monitoringRoutes from './routes/monitoring.routes.js';
import { monitoringMiddleware, errorMonitoringMiddleware } from './middleware/monitoring.middleware.js';
import { swaggerSpec, swaggerUi } from './lib/swagger.js';

const app = express();
// CORS first
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL || '*' }));
// Body parsing - MUST be before helmet
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(monitoringMiddleware);
// Security headers (after body parsing to avoid blocking)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // Disable content type sniffing that might interfere
  noSniff: false
}));

// Rate limiting
app.use('/api', rateLimit(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'corp-admin-backend' });
});

// Test endpoint for JSON parsing
app.post('/test-json', (req, res) => {
  console.log('Body received:', JSON.stringify(req.body));
  res.json({ received: req.body, bodyType: typeof req.body });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/security-audit', securityAuditRoutes);
app.use('/api/system-health', systemHealthRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/admin-management', adminManagementRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/data-operations', dataOperationsRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handler with monitoring
app.use(errorMonitoringMiddleware);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 4001;
const httpServer = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Corp Admin Backend listening on ${port}`);
});

// Initialize Socket.IO for real-time features
if (process.env.ENABLE_WEBSOCKET === 'true') {
  const { initializeSocket } = await import('./lib/socket-server.js');
  initializeSocket(httpServer);
  console.log('Socket.IO initialized');
}


