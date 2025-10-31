import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

// In-memory alert store (in production, use database)
const alerts: any[] = [];

export const getAlerts = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { status, type } = req.query;
    let filteredAlerts = alerts;
    
    if (status) {
      filteredAlerts = filteredAlerts.filter((a: any) => a.status === status);
    }
    if (type) {
      filteredAlerts = filteredAlerts.filter((a: any) => a.type === type);
    }
    
    res.json({ alerts: filteredAlerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const createAlert = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { type, severity, message, resourceId } = req.body;
    const alert = {
      id: `alert_${Date.now()}`,
      type,
      severity, // info, warning, error, critical
      message,
      resourceId,
      status: 'active',
      createdAt: new Date(),
    };
    alerts.unshift(alert);
    res.status(201).json({ alert });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

export const updateAlert = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const alert = alerts.find((a: any) => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    alert.status = status;
    alert.updatedAt = new Date();
    res.json({ alert });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

export const deleteAlert = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const index = alerts.findIndex((a: any) => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    alerts.splice(index, 1);
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

// Auto-generate alerts for system events
export const checkSystemAlerts = async () => {
  // Check for expiring licenses
  const expiringLicenses = await prisma.license.findMany({
    where: {
      expiresAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      },
      status: 'ACTIVE',
    },
    include: { tenant: { select: { name: true } } },
  });

  expiringLicenses.forEach((license) => {
    if (!alerts.some((a: any) => a.resourceId === license.id && a.type === 'license_expiring')) {
      alerts.unshift({
        id: `alert_${Date.now()}_${license.id}`,
        type: 'license_expiring',
        severity: 'warning',
        message: `Lisans yakında sona eriyor: ${license.tenant.name}`,
        resourceId: license.id,
        status: 'active',
        createdAt: new Date(),
      });
    }
  });
};

// Run checks periodically
setInterval(checkSystemAlerts, 60 * 60 * 1000); // Every hour

