import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';

export interface CorpAuthRequest extends Request {
  adminId?: string;
  adminRole?: string;
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = async (req: CorpAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.CORP_JWT_SECRET || process.env.JWT_SECRET!) as { adminId: string; role: string };
    
    const admin = await prisma.corpAdmin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive admin account' });
    }

    req.adminId = admin.id;
    req.adminRole = admin.role;
    req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: CorpAuthRequest, res: Response, next: NextFunction) => {
    if (!req.adminRole || !roles.includes(req.adminRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

