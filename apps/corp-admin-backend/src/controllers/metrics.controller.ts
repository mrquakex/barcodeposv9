import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const getMetrics = async (req: CorpAuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate MRR (Monthly Recurring Revenue)
    const activeLicenses = await prisma.license.findMany({
      where: { status: 'ACTIVE' },
      include: { tenant: { select: { id: true } } },
    });

    const mrr = activeLicenses.reduce((sum, license) => {
      // Simplified calculation - in production, use actual pricing
      const monthlyPrice = license.plan === 'ENTERPRISE' ? 5000 : license.plan === 'PREMIUM' ? 3000 : 1000;
      return sum + monthlyPrice;
    }, 0);

    // Calculate Churn Rate (simplified)
    const licensesExpiredLastMonth = await prisma.license.count({
      where: {
        status: 'EXPIRED',
        expiresAt: {
          gte: oneMonthAgo,
          lte: now,
        },
      },
    });

    const activeLicensesCount = activeLicenses.length;
    const churnRate = activeLicensesCount > 0 
      ? (licensesExpiredLastMonth / activeLicensesCount) * 100 
      : 0;

    // Calculate CLV (Customer Lifetime Value) - simplified
    const totalRevenue = await prisma.paymentReceipt.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
    });

    const totalTenants = await prisma.tenant.count();
    const avgCLV = totalTenants > 0 
      ? (totalRevenue._sum.amount || 0) / totalTenants 
      : 0;

    // Active Users (last 30 days)
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // System Uptime (simplified - would be tracked separately)
    const systemUptime = 99.9; // Placeholder

    // API Response Time (simplified - would be tracked separately)
    const avgResponseTime = 120; // milliseconds

    // Error Rate (simplified - would be tracked separately)
    const errorRate = 0.1; // percentage

    res.json({
      metrics: {
        totalRevenue: totalRevenue._sum.amount || 0,
        mrr,
        churnRate: churnRate.toFixed(2),
        clv: avgCLV.toFixed(2),
        activeUsers,
        systemUptime: systemUptime.toFixed(2),
        apiResponseTime: avgResponseTime,
        errorRate: errorRate.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

