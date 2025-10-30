import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import licenseRoutes from './routes/license.routes.js';

const app = express();
app.use(helmet());
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(cookieParser());

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


