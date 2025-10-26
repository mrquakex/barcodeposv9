import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
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
import campaignRoutes from './routes/campaign.routes';
import branchRoutes from './routes/branch.routes';
import activityRoutes from './routes/activity.routes';
import aiRoutes from './routes/ai.routes';
import geminiRoutes from './routes/gemini.routes';
import priceMonitorRoutes from './routes/price-monitor.routes';
import prisma from './lib/prisma';
import benimPOSScraperService from './services/benimpos-scraper.service';
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
    origin: true,
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
app.use(cors({
  origin: true, // Tüm originlere izin ver
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
app.use('/api/campaigns', campaignRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/price-monitor', priceMonitorRoutes);

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
      console.log('📦 Database is empty. Running seed...');
      await execAsync('npx tsx prisma/seed.ts');
      console.log('✅ Database seeded successfully!');
    } else {
      console.log(`✅ Database already initialized (${userCount} users found)`);
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Initialize Scraper Cron Job
async function initializeScraperCron() {
  try {
    const config = await prisma.scraperConfig.findUnique({
      where: { source: 'BENIMPOS' }
    });

    if (!config) {
      // Create default config
      await prisma.scraperConfig.create({
        data: {
          source: 'BENIMPOS',
          email: process.env.BENIMPOS_EMAIL || 'mrquakex0@gmail.com',
          password: process.env.BENIMPOS_PASSWORD || 'elwerci12',
          isActive: false, // Start disabled by default
          cronSchedule: '0 9 * * *', // Every day at 09:00
        }
      });
      console.log('📝 Scraper config created (disabled by default)');
    }

    if (config && config.isActive) {
      // Schedule cron job
      cron.schedule(config.cronSchedule, async () => {
        console.log('⏰ Scheduled scraping started...');
        const result = await benimPOSScraperService.runScraping();
        
        if (result.success) {
          console.log(`✅ Scheduled scraping completed: ${result.changes.length} changes`);
          io.emit('scraping-completed', {
            success: true,
            changesCount: result.changes.length,
            changes: result.changes,
            timestamp: new Date(),
          });
        } else {
          console.error('❌ Scheduled scraping failed:', result.error);
          io.emit('scraping-completed', {
            success: false,
            error: result.error,
            timestamp: new Date(),
          });
        }
      });

      console.log(`⏰ Scraper cron job scheduled: ${config.cronSchedule}`);
    } else {
      console.log('⏸️  Scraper is disabled');
    }
  } catch (error) {
    console.error('❌ Scraper cron initialization error:', error);
  }
}

// Start server
async function startServer() {
  await initializeDatabase();
  await initializeScraperCron();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`✅ Basic POS system ready!`);
    console.log(`🕷️  Price monitoring system initialized!`);
  });
}

startServer();

