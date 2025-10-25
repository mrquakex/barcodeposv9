import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import customerRoutes from './routes/customer.routes';
import saleRoutes from './routes/sale.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import userRoutes from './routes/user.routes';
import supplierRoutes from './routes/supplier.routes';
import stockRoutes from './routes/stock.routes';
import expenseRoutes from './routes/expense.routes';
import financeRoutes from './routes/finance.routes';
import campaignRoutes from './routes/campaign.routes';
import branchRoutes from './routes/branch.routes';
import activityRoutes from './routes/activity.routes';
import aiRoutes from './routes/ai.routes';
import gdprRoutes from './routes/gdpr.routes';
import analyticsRoutes from './routes/analytics.routes';
import gamificationRoutes from './routes/gamification.routes';
import { websocketService } from './services/websocket.service';
import { createApolloServer } from './graphql';
import { monitoringService } from './services/monitoring.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Security & Performance Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // Her IP için max 1000 istek
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS & Body Parser
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize WebSocket
websocketService.initialize(httpServer);

// Initialize GraphQL Server
createApolloServer(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gamification', gamificationRoutes);

// Health check
app.get('/health', (req, res) => {
  const health = monitoringService.getHealth();
  res.json(health);
});

// Metrics endpoint (admin only)
app.get('/metrics', (req, res) => {
  const metrics = monitoringService.getMetrics();
  res.json(metrics);
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket is ready on ws://localhost:${PORT}`);
});

