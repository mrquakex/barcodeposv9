import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const getDashboardStats = async (req: CorpAuthRequest, res: Response) => {
  try {
    const [totalTenants, activeTenants, totalLicenses, activeLicenses, totalUsers] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
    ]);

    // Get expiring licenses (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLicenses = await prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expiresAt: 'asc' },
      take: 10,
    });

    res.json({
      totalTenants,
      activeTenants,
      totalLicenses,
      activeLicenses,
      totalUsers,
      expiringLicenses,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getRecentActivities = async (req: CorpAuthRequest, res: Response) => {
  try {
    const activities = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        admin: {
          select: { name: true, email: true }
        }
      }
    });
    res.json({ activities });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};
