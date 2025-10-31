import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

// Simple CSV export utility
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(headers.join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export const exportTenants = async (req: CorpAuthRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            licenses: true,
          },
        },
        licenses: {
          where: { status: 'ACTIVE' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    const formattedData = tenants.map((t: any) => ({
      id: t.id,
      name: t.name,
      isActive: t.isActive ? 'Aktif' : 'Pasif',
      userCount: t._count.users,
      productCount: t._count.products,
      licenseCount: t._count.licenses,
      activeLicense: t.licenses[0]?.plan || '-',
      createdAt: t.createdAt.toISOString(),
    }));

    const headers = ['id', 'name', 'isActive', 'userCount', 'productCount', 'licenseCount', 'activeLicense', 'createdAt'];
    const csv = convertToCSV(formattedData, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tenants.csv"');
    res.send('\ufeff' + csv); // BOM for UTF-8
  } catch (error) {
    console.error('Export tenants error:', error);
    res.status(500).json({ error: 'Failed to export tenants' });
  }
};

export const exportLicenses = async (req: CorpAuthRequest, res: Response) => {
  try {
    const licenses = await prisma.license.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    const formattedData = licenses.map((l: any) => ({
      id: l.id,
      tenantName: l.tenant?.name || l.tenantId,
      plan: l.plan,
      status: l.status,
      includesMobile: l.includesMobile ? 'Evet' : 'Hayır',
      trial: l.trial ? 'Evet' : 'Hayır',
      startsAt: l.startsAt.toISOString(),
      expiresAt: l.expiresAt ? l.expiresAt.toISOString() : '-',
    }));

    const headers = ['id', 'tenantName', 'plan', 'status', 'includesMobile', 'trial', 'startsAt', 'expiresAt'];
    const csv = convertToCSV(formattedData, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="licenses.csv"');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Export licenses error:', error);
    res.status(500).json({ error: 'Failed to export licenses' });
  }
};

export const exportUsers = async (req: CorpAuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    const formattedData = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      tenantName: u.tenant?.name || '-',
      isActive: u.isActive ? 'Aktif' : 'Pasif',
      createdAt: u.createdAt.toISOString(),
    }));

    const headers = ['id', 'email', 'name', 'role', 'tenantName', 'isActive', 'createdAt'];
    const csv = convertToCSV(formattedData, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
};

export const exportAuditLogs = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { startDate, endDate, action, resource } = req.query;
    
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    if (action) where.action = action;
    if (resource) where.resource = resource;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, email: true, name: true },
        },
      },
      take: 10000, // Limit to prevent memory issues
    });

    const formattedData = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId || '-',
      adminEmail: log.admin?.email || '-',
      adminName: log.admin?.name || '-',
      ipAddress: log.ipAddress || '-',
      createdAt: log.createdAt.toISOString(),
    }));

    const headers = ['id', 'action', 'resource', 'resourceId', 'adminEmail', 'adminName', 'ipAddress', 'createdAt'];
    const csv = convertToCSV(formattedData, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
};

