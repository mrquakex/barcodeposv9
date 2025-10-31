import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import licenseRoutes from './routes/license.routes.js';
import usersRoutes from './routes/users.routes.js';
import auditRoutes from './routes/audit.routes.js';

const app = express();
// CORS first
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL || '*' }));
// Body parsing - MUST be before helmet
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Security headers (after body parsing to avoid blocking)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // Disable content type sniffing that might interfere
  noSniff: false
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'corp-admin-backend' });
});

// Test endpoint for JSON parsing
app.post('/test-json', (req, res) => {
  console.log('Body received:', JSON.stringify(req.body));
  res.json({ received: req.body, bodyType: typeof req.body });
});

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', auditRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Corp Admin Backend listening on ${port}`);
});


