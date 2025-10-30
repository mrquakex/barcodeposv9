import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import licenseRoutes from './routes/license.routes.js';

const app = express();
// CORS first
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL || '*' }));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Security headers (after body parsing)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'corp-admin-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/licenses', licenseRoutes);

const port = process.env.PORT || 4001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Corp Admin Backend listening on ${port}`);
});


