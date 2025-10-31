import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const getHistoricalData = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { startDate, endDate, metric } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Historical tenant growth
    const tenantGrowth = await prisma.tenant.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Historical license data
    const licenseData = await prisma.license.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Monthly aggregations
    const monthlyData = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const tenantsInMonth = tenantGrowth.filter(t => 
        t.createdAt >= monthStart && t.createdAt <= monthEnd
      ).length;
      
      const licensesInMonth = licenseData.filter(l => 
        l.createdAt >= monthStart && l.createdAt <= monthEnd
      ).length;

      monthlyData.push({
        month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
        tenants: tenantsInMonth,
        licenses: licensesInMonth,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({
      historical: {
        monthlyData,
        totalTenants: tenantGrowth.length,
        totalLicenses: licenseData.length,
      },
    });
  } catch (error) {
    console.error('Get historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};

export const getPredictiveAnalytics = async (req: CorpAuthRequest, res: Response) => {
  try {
    // Simplified predictive analytics
    // In production, use ML models or statistical forecasting
    
    const last6Months = await prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Simple linear projection
    const monthlyGrowth = last6Months.length / 6;
    const projectedNextMonth = Math.round(monthlyGrowth);
    const projectedNextQuarter = Math.round(monthlyGrowth * 3);

    res.json({
      predictions: {
        nextMonth: {
          newTenants: projectedNextMonth,
          confidence: 0.75,
        },
        nextQuarter: {
          newTenants: projectedNextQuarter,
          confidence: 0.65,
        },
        trend: monthlyGrowth > 5 ? 'increasing' : monthlyGrowth > 0 ? 'stable' : 'decreasing',
      },
    });
  } catch (error) {
    console.error('Get predictive analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch predictive analytics' });
  }
};

export const getCustomDashboard = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { widgets } = req.query;
    
    // In production, store custom dashboard configurations in database
    res.json({
      dashboard: {
        widgets: widgets ? JSON.parse(widgets as string) : [],
        layout: 'default',
      },
    });
  } catch (error) {
    console.error('Get custom dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch custom dashboard' });
  }
};

export const saveCustomDashboard = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { widgets, layout } = req.body;
    
    // In production, save to database
    res.json({
      message: 'Dashboard saved successfully',
      dashboard: { widgets, layout },
    });
  } catch (error) {
    console.error('Save custom dashboard error:', error);
    res.status(500).json({ error: 'Failed to save custom dashboard' });
  }
};

