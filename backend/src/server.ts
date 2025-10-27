// CRITICAL: Load environment variables BEFORE any imports that use them!
import dotenv from 'dotenv';
import path from 'path';

// Force dotenv to look in the correct directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
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
// import campaignRoutes from './routes/campaign.routes'; // Disabled: Campaign model removed from schema
import branchRoutes from './routes/branch.routes';
import activityRoutes from './routes/activity.routes';
import aiRoutes from './routes/ai.routes';
import geminiRoutes from './routes/gemini.routes';
// import priceMonitorRoutes from './routes/price-monitor.routes'; // Disabled: PriceChange/ScraperConfig models removed from schema
import aiActionsRoutes from './routes/ai-actions.routes';
import aiAdvancedRoutes from './routes/ai-advanced.routes';
import invoiceRoutes from './routes/invoice.routes';
import shiftRoutes from './routes/shift.routes';
import stockCountRoutes from './routes/stockCount.routes';
import stockTransferRoutes from './routes/stockTransfer.routes';
import stockMovementRoutes from './routes/stockMovement.routes';
import purchaseOrderRoutes from './routes/purchaseOrder.routes';
import returnRoutes from './routes/return.routes';
import prisma from './lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Temporarily disabled for production deploy
// import aiRoutes from './routes/ai.routes';
// import gdprRoutes from './routes/gdpr.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import gamificationRoutes from './routes/gamification.routes';
// import { websocketService } from './services/websocket.service';
// import { createApolloServer } from './graphql';
// import { monitoringService } from './services/monitoring.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://www.barcodepos.trade',
      'https://barcodepos.trade',
      'https://barcodepos-frontend.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Trust proxy for Render.com
app.set('trust proxy', 1);

// CORS - ÖNCELİKLE CORS AYARLARINI YAP!
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://www.barcodepos.trade',
  'https://barcodepos.trade',
  'https://barcodepos-frontend.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    // Default: allow (fallback for backward compatibility)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handler for all routes
app.options('*', cors());

// Security & Performance Middleware (Helmet disabled for development)
// app.use(helmet({
//   contentSecurityPolicy: false,
// }));
app.use(compression());

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting - CORS'tan SONRA
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // Her IP için max 1000 istek
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Initialize WebSocket (temporarily disabled)
// websocketService.initialize(httpServer);

// Initialize GraphQL Server (temporarily disabled)
// createApolloServer(app);

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
// app.use('/api/campaigns', campaignRoutes); // Disabled: Campaign model removed from schema
app.use('/api/branches', branchRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gemini', geminiRoutes);
// app.use('/api/price-monitor', priceMonitorRoutes); // Disabled: PriceChange/ScraperConfig models removed from schema
app.use('/api/ai-actions', aiActionsRoutes);
app.use('/api/ai-advanced', aiAdvancedRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/stock-counts', stockCountRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/returns', returnRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (temporarily disabled)
// app.get('/metrics', (req, res) => {
//   const metrics = monitoringService.getMetrics();
//   res.json(metrics);
// });

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Auto-seed database if empty
async function initializeDatabase() {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('Veritabanı başlatılıyor...');
      await execAsync('npx tsx prisma/seed.ts');
      console.log('Veritabanı hazır');
    } else {
      console.log(`Veritabanı hazır (${userCount} kullanıcı)`);
    }
  } catch (error) {
    console.error('Veritabanı hatası:', error);
  }
}

// Initialize Scraper Cron Job
async function initializeScraperCron() {
  // Fiyat tarayıcı devre dışı
}

// Start server
async function startServer() {
  await initializeDatabase();
  await initializeScraperCron();
  
  httpServer.listen(PORT, () => {
    console.log(`Server çalışıyor: http://localhost:${PORT}`);
    console.log(`Sistem hazır`);
  });
}

startServer();

