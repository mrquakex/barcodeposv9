import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const listAuditLogs = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', action, resource, adminId, startDate, endDate } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (action) {
      where.action = action as string;
    }
    if (resource) {
      where.resource = resource as string;
    }
    if (adminId) {
      where.adminId = adminId as string;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('List audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

