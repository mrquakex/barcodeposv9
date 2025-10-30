import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

export const listLicenses = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', status, tenantId } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId as string;

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { startsAt: 'desc' },
        include: {
          tenant: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.license.count({ where })
    ]);

    res.json({
      licenses,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('List licenses error:', error);
    res.status(500).json({ error: 'Failed to list licenses' });
  }
};

export const createLicense = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { tenantId, plan, includesMobile, trial, trialEndsAt, expiresAt, notes } = req.body;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const license = await prisma.license.create({
      data: {
        tenantId,
        plan,
        includesMobile: includesMobile || false,
        trial: trial || false,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
        status: 'ACTIVE'
      },
      include: {
        tenant: {
          select: { id: true, name: true }
        }
      }
    });

    await createAuditLog({
      adminId: req.adminId!,
      action: 'CREATE',
      resource: 'license',
      resourceId: license.id,
      details: JSON.stringify({ license }),
      reason: req.body.reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ license });
  } catch (error) {
    console.error('Create license error:', error);
    res.status(500).json({ error: 'Failed to create license' });
  }
};

export const updateLicense = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, plan, includesMobile, expiresAt, notes } = req.body;

    const before = await prisma.license.findUnique({ where: { id } });
    if (!before) {
      return res.status(404).json({ error: 'License not found' });
    }

    const license = await prisma.license.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(plan && { plan }),
        ...(includesMobile !== undefined && { includesMobile }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        tenant: {
          select: { id: true, name: true }
        }
      }
    });

    await createAuditLog({
      adminId: req.adminId!,
      action: 'UPDATE',
      resource: 'license',
      resourceId: id,
      details: JSON.stringify({ before, after: license }),
      reason: req.body.reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ license });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
};

