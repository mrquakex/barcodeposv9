import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const getRevenueAnalytics = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    // Placeholder - would aggregate from sales/payments
    res.json({
      totalRevenue: 0,
      mrr: 0,
      chartData: [],
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};

export const getTenantAnalytics = async (req: CorpAuthRequest, res: Response) => {
  try {
    const [total, active, growth] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      // Calculate growth from historical data
    ]);

    res.json({
      total,
      active,
      growth: 0,
      chartData: [],
    });
  } catch (error) {
    console.error('Get tenant analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant analytics' });
  }
};

export const getUserAnalytics = async (req: CorpAuthRequest, res: Response) => {
  try {
    const [total, active] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    res.json({
      total,
      active,
      chartData: [],
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
};

