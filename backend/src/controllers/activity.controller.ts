import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllActivityLogs = async (req: Request, res: Response) => {
  try {
    const { userId, module, action } = req.query;
    const where: any = {};
    
    if (userId) where.userId = userId as string;
    if (module) where.module = module as string;
    if (action) where.action = action as string;

    const logs = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } }, branch: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Aktivite logları getirilemedi' });
  }
};

export const createActivityLog = async (userId: string, action: string, module: string, description: string, ipAddress?: string) => {
  try {
    await prisma.activityLog.create({
      data: { userId, action, module, description, ipAddress },
    });
  } catch (error) {
    console.error('Create activity log error:', error);
  }
};


