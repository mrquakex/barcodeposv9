import { Response } from 'express';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

// In-memory settings store (in production, use database or Redis)
const settingsStore: Record<string, any> = {
  general: {
    siteName: 'BarcodePOS Control Plane',
    siteUrl: 'https://admin.barcodepos.trade',
    timezone: 'Europe/Istanbul',
    language: 'tr',
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    mfaRequired: false,
    ipWhitelistEnabled: false,
  },
  license: {
    defaultPlan: 'STANDARD',
    trialDays: 14,
    autoRenewal: false,
  },
  notifications: {
    emailEnabled: true,
    emailSmtpHost: '',
    emailSmtpPort: 587,
    emailFrom: '',
    notificationsEnabled: true,
  },
  system: {
    maintenanceMode: false,
    cacheEnabled: true,
    debugMode: false,
  },
};

export const getSettings = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    if (category && settingsStore[category]) {
      res.json({ settings: settingsStore[category] });
    } else {
      res.json({ settings: settingsStore });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    const { settings } = req.body;

    if (!category || !settingsStore[category]) {
      return res.status(400).json({ error: 'Invalid settings category' });
    }

    settingsStore[category] = {
      ...settingsStore[category],
      ...settings,
    };

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'UPDATE',
      resource: 'SETTINGS',
      resourceId: category,
      ipAddress: req.ip,
    });

    res.json({
      message: 'Settings updated successfully',
      settings: settingsStore[category],
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

