import { Response } from 'express';
import prisma from '../lib/prisma';
import { CorpAuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../lib/audit';

export const listTenants = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', search = '', status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { id: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.isActive = status === 'active';
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              products: true,
              licenses: true
            }
          },
          licenses: {
            where: { status: 'ACTIVE' },
            orderBy: { expiresAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.tenant.count({ where })
    ]);

    res.json({
      tenants: tenants.map((t: any) => ({
        ...t,
        userCount: t._count.users,
        productCount: t._count.products,
        licenseCount: t._count.licenses,
        activeLicense: t.licenses[0] || null
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('List tenants error:', error);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
};

export const getTenant = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        licenses: {
          orderBy: { startsAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
};

export const updateTenant = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isActive, ownerUserId } = req.body;

    const before = await prisma.tenant.findUnique({ where: { id } });
    if (!before) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(ownerUserId !== undefined && { ownerUserId })
      }
    });

    await createAuditLog({
      adminId: req.adminId!,
      action: 'UPDATE',
      resource: 'tenant',
      resourceId: id,
      details: JSON.stringify({ before, after: tenant }),
      reason: req.body.reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ tenant });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
};

