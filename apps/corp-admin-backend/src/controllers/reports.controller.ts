import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

export const generateTenantReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate, status } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    if (status) where.isActive = status === 'active';

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: { users: true, products: true, licenses: true },
        },
        licenses: {
          select: { plan: true, status: true, expiresAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_TENANT',
      details: `Generated tenant report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report: tenants });
    } else if (format === 'csv') {
      const csvHeader = 'ID,Name,Active,Users,Products,Licenses,Created At\n';
      const csvRows = tenants.map(t =>
        `${t.id},"${t.name}",${t.isActive},${t._count.users},${t._count.products},${t._count.licenses},${t.createdAt.toISOString()}`
      ).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('tenant_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate tenant report error:', error);
    res.status(500).json({ error: 'Failed to generate tenant report' });
  }
};

export const generateLicenseReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate, status, plan } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    if (status) where.status = status as string;
    if (plan) where.plan = plan as string;

    const licenses = await prisma.license.findMany({
      where,
      include: { tenant: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_LICENSE',
      details: `Generated license report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report: licenses });
    } else if (format === 'csv') {
      const csvHeader = 'ID,Tenant Name,Plan,Status,Includes Mobile,Trial,Expires At,Created At\n';
      const csvRows = licenses.map(l =>
        `${l.id},"${l.tenant.name}",${l.plan},${l.status},${l.includesMobile},${l.trial},${l.expiresAt?.toISOString() || ''},${l.createdAt.toISOString()}`
      ).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('license_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate license report error:', error);
    res.status(500).json({ error: 'Failed to generate license report' });
  }
};

export const generateUserReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate, status, tenantId } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    if (status) where.isActive = status === 'active';
    if (tenantId) where.tenantId = tenantId as string;

    const users = await prisma.user.findMany({
      where,
      include: { tenant: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_USER',
      details: `Generated user report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report: users });
    } else if (format === 'csv') {
      const csvHeader = 'ID,Name,Email,Phone,Tenant,Active,Role,Created At\n';
      const csvRows = users.map(u =>
        `${u.id},"${u.name}","${u.email}",${u.phone || ''},"${u.tenant.name}",${u.isActive},${u.role || ''},${u.createdAt.toISOString()}`
      ).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('user_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate user report error:', error);
    res.status(500).json({ error: 'Failed to generate user report' });
  }
};

export const generateFinancialReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.paymentReceipt.findMany({
        where,
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = invoices
      .filter((inv) => inv.status === 'PENDING')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'COMPLETED' ? p.amount : 0), 0);

    const report = {
      summary: {
        totalRevenue,
        totalPending,
        totalPaid,
        invoiceCount: invoices.length,
        paymentCount: payments.length,
      },
      invoices,
      payments,
    };

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_FINANCIAL',
      details: `Generated financial report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report });
    } else if (format === 'csv') {
      const csvHeader = 'Type,ID,Tenant,Amount,Currency,Status,Date\n';
      const csvRows = [
        ...invoices.map(inv => `Invoice,${inv.id},"${inv.tenant.name}",${inv.amount},${inv.currency},${inv.status},${inv.createdAt.toISOString()}`),
        ...payments.map(pay => `Payment,${pay.id},"${pay.tenant.name}",${pay.amount},${pay.currency},${pay.status},${pay.createdAt.toISOString()}`),
      ].join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('financial_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate financial report error:', error);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
};

export const generateSystemReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

    const [auditLogs, admins, tenants, licenses, users] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.corpAdmin.findMany({
        select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true },
      }),
      prisma.tenant.count(),
      prisma.license.count(),
      prisma.user.count(),
    ]);

    const actionCounts = auditLogs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const report = {
      summary: {
        totalTenants: tenants,
        totalLicenses: licenses,
        totalUsers: users,
        totalAdmins: admins.length,
        activeAdmins: admins.filter(a => a.isActive).length,
        auditLogCount: auditLogs.length,
        actionCounts,
      },
      admins,
      recentAuditLogs: auditLogs.slice(0, 100),
    };

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_SYSTEM',
      details: `Generated system report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report });
    } else if (format === 'csv') {
      const csvHeader = 'Metric,Value\n';
      const csvRows = [
        `Total Tenants,${tenants}`,
        `Total Licenses,${licenses}`,
        `Total Users,${users}`,
        `Total Admins,${admins.length}`,
        `Active Admins,${admins.filter(a => a.isActive).length}`,
        `Audit Logs,${auditLogs.length}`,
        ...Object.entries(actionCounts).map(([action, count]) => `${action},${count}`),
      ].join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('system_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate system report error:', error);
    res.status(500).json({ error: 'Failed to generate system report' });
  }
};

export const generateRevenueReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

    const payments = await prisma.paymentReceipt.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_REVENUE',
      details: `Generated revenue report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report: payments });
    } else if (format === 'csv') {
      const csvHeader = 'ID,Tenant ID,Amount,Currency,Status,Created At\n';
      const csvRows = payments.map(p =>
        `${p.id},${p.tenantId},${p.amount},${p.currency},${p.status},${p.createdAt.toISOString()}`
      ).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('revenue_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate revenue report error:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
};

export const generateUsageReport = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'GENERATE_REPORT',
      resource: 'REPORT_USAGE',
      details: `Generated usage report (format: ${format})`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      return res.json({ report: auditLogs });
    } else if (format === 'csv') {
      const csvHeader = 'ID,Admin ID,Action,Resource,Resource ID,IP Address,Created At\n';
      const csvRows = auditLogs.map(log =>
        `${log.id},${log.adminId},${log.action},${log.resource},${log.resourceId || ''},${log.ipAddress || ''},${log.createdAt.toISOString()}`
      ).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('usage_report.csv');
      return res.send(csvHeader + csvRows);
    }

    res.status(400).json({ error: 'Invalid report format' });
  } catch (error) {
    console.error('Generate usage report error:', error);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
};
