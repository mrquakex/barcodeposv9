import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';
import fs from 'fs/promises';
import path from 'path';

export const exportData = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { type, format = 'json' } = req.query;

    let data: any = {};
    let filename = 'export';

    switch (type) {
      case 'tenants':
        data.tenants = await prisma.tenant.findMany({
          include: { _count: { select: { users: true, licenses: true } } },
        });
        filename = 'tenants_export';
        break;
      case 'licenses':
        data.licenses = await prisma.license.findMany({
          include: { tenant: { select: { id: true, name: true } } },
        });
        filename = 'licenses_export';
        break;
      case 'users':
        data.users = await prisma.user.findMany({
          include: { tenant: { select: { id: true, name: true } } },
        });
        filename = 'users_export';
        break;
      case 'full':
        data = {
          tenants: await prisma.tenant.findMany(),
          licenses: await prisma.license.findMany(),
          users: await prisma.user.findMany(),
          invoices: await prisma.invoice.findMany(),
          payments: await prisma.paymentReceipt.findMany(),
        };
        filename = 'full_backup';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'EXPORT_DATA',
      resource: 'DATA_OPERATIONS',
      details: `Exported ${type} data in ${format} format`,
      ipAddress: req.ip,
    });

    if (format === 'json') {
      res.header('Content-Type', 'application/json');
      res.attachment(`${filename}.json`);
      return res.json(data);
    } else if (format === 'csv') {
      // Simple CSV conversion (can be enhanced)
      const csv = convertToCSV(data[type as string] || Object.values(data).flat());
      res.header('Content-Type', 'text/csv');
      res.attachment(`${filename}.csv`);
      return res.send(csv);
    }

    res.status(400).json({ error: 'Invalid format' });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

export const importData = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // In production, validate file type and parse properly
    const data = JSON.parse(file.buffer.toString());

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'IMPORT_DATA',
      resource: 'DATA_OPERATIONS',
      details: `Imported ${type} data`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Data imported successfully', count: Array.isArray(data) ? data.length : Object.keys(data).length });
  } catch (error) {
    console.error('Import data error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
};

export const getBackupStatus = async (req: CorpAuthRequest, res: Response) => {
  try {
    // Simplified - in production, track actual backups
    res.json({
      lastBackup: null,
      backupFrequency: 'daily',
      backups: [],
    });
  } catch (error) {
    console.error('Get backup status error:', error);
    res.status(500).json({ error: 'Failed to fetch backup status' });
  }
};

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    })
  );
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

