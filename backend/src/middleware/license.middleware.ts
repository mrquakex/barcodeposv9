import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const requireActiveLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Super admin bypass
    if (user.isSuperAdmin) return next();

    if (!user.tenantId) return res.status(403).json({ error: 'Tenant not assigned' });

    // Trial valid?
    if (user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) {
      return next();
    }

    // Active license for tenant
    const license = await prisma.license.findFirst({
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!license) {
      return res.status(402).json({ error: 'License required or expired' });
    }

    (req as any).tenantId = user.tenantId;
    (req as any).license = license;
    next();
  } catch (e) {
    console.error('License check error', e);
    res.status(500).json({ error: 'License check failed' });
  }
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!user.isSuperAdmin) return res.status(403).json({ error: 'Super admin required' });
    next();
  } catch (e) {
    console.error('SuperAdmin check error', e);
    res.status(500).json({ error: 'Authorization failed' });
  }
};


