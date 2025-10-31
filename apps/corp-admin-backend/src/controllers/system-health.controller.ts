import { Response } from 'express';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import os from 'os';

export const getSystemHealth = async (req: CorpAuthRequest, res: Response) => {
  try {
    const cpuUsage = os.loadavg()[0]; // 1-minute load average
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Get uptime
    const uptime = os.uptime();
    const uptimeDays = Math.floor(uptime / 86400);

    const health = {
      cpu: {
        loadAverage: cpuUsage,
        usage: Math.min(100, (cpuUsage / os.cpus().length) * 100),
        cores: os.cpus().length,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: memoryUsagePercent,
      },
      uptime: {
        seconds: uptime,
        days: uptimeDays,
        formatted: `${uptimeDays} gün ${Math.floor((uptime % 86400) / 3600)} saat`,
      },
      platform: os.platform(),
      hostname: os.hostname(),
      timestamp: new Date(),
    };

    res.json(health);
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

export const getDatabaseHealth = async (req: CorpAuthRequest, res: Response) => {
  try {
    const prisma = (await import('../lib/prisma.js')).default;
    const startTime = Date.now();
    
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    res.json({
      status: 'connected',
      responseTime,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date(),
    });
  }
};

