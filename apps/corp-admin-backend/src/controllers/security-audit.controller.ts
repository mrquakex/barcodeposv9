import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const getSecurityEvents = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', type, startDate, endDate } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      action: {
        in: ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'MFA_SETUP', 'MFA_ENABLED', 'MFA_DISABLED', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE'],
      },
    };

    if (type) where.action = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [events, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
};

export const getFailedLogins = async (req: CorpAuthRequest, res: Response) => {
  try {
    const failedLogins = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_FAILED',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        admin: {
          select: { id: true, email: true },
        },
      },
    });

    res.json({ failedLogins });
  } catch (error) {
    console.error('Get failed logins error:', error);
    res.status(500).json({ error: 'Failed to fetch failed logins' });
  }
};

export const getSuspiciousActivity = async (req: CorpAuthRequest, res: Response) => {
  try {
    // Detect suspicious activity: multiple failed logins from same IP
    const suspiciousIPs = await prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 5, // More than 5 failed attempts
          },
        },
      },
    });

    res.json({ suspiciousActivity: suspiciousIPs });
  } catch (error) {
    console.error('Get suspicious activity error:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious activity' });
  }
};

