import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

export const bulkDeleteTenants = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const tenants = await prisma.tenant.findMany({
      where: { id: { in: ids } },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            licenses: true,
          },
        },
      },
    });

    const deletableTenants = tenants.filter(
      (t) => t._count.users === 0 && t._count.products === 0 && t._count.licenses === 0
    );

    if (deletableTenants.length === 0) {
      return res.status(400).json({
        error: 'No tenants can be deleted (all have associated data)',
      });
    }

    const deletedIds = deletableTenants.map((t) => t.id);
    await prisma.tenant.deleteMany({
      where: { id: { in: deletedIds } },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'BULK_DELETE',
      resource: 'TENANT',
      resourceId: deletedIds.join(','),
      ipAddress: req.ip,
    });

    res.json({
      deleted: deletedIds.length,
      failed: ids.length - deletedIds.length,
      deletedIds,
    });
  } catch (error) {
    console.error('Bulk delete tenants error:', error);
    res.status(500).json({ error: 'Failed to bulk delete tenants' });
  }
};

export const bulkUpdateTenants = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { ids, data } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Update data is required' });
    }

    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.tenant.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'BULK_UPDATE',
      resource: 'TENANT',
      resourceId: ids.join(','),
      ipAddress: req.ip,
    });

    res.json({
      updated: ids.length,
      updatedIds: ids,
    });
  } catch (error) {
    console.error('Bulk update tenants error:', error);
    res.status(500).json({ error: 'Failed to bulk update tenants' });
  }
};

export const bulkDeleteLicenses = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    await prisma.license.deleteMany({
      where: { id: { in: ids } },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'BULK_DELETE',
      resource: 'LICENSE',
      resourceId: ids.join(','),
      ipAddress: req.ip,
    });

    res.json({
      deleted: ids.length,
      deletedIds: ids,
    });
  } catch (error) {
    console.error('Bulk delete licenses error:', error);
    res.status(500).json({ error: 'Failed to bulk delete licenses' });
  }
};

export const bulkDeleteUsers = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      include: {
        _count: {
          select: {
            sales: true,
            shifts: true,
          },
        },
      },
    });

    const deletableUsers = users.filter(
      (u) => u._count.sales === 0 && u._count.shifts === 0
    );

    if (deletableUsers.length === 0) {
      return res.status(400).json({
        error: 'No users can be deleted (all have associated data)',
      });
    }

    const deletedIds = deletableUsers.map((u) => u.id);
    await prisma.user.deleteMany({
      where: { id: { in: deletedIds } },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'BULK_DELETE',
      resource: 'USER',
      resourceId: deletedIds.join(','),
      ipAddress: req.ip,
    });

    res.json({
      deleted: deletedIds.length,
      failed: ids.length - deletedIds.length,
      deletedIds,
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
};

