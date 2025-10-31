import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

export const getAPIKeys = async (req: CorpAuthRequest, res: Response) => {
  try {
    // In production, use database table for API keys
    res.json({ apiKeys: [] });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

export const createAPIKey = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { name, permissions } = req.body;
    const apiKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = 'barcodepos_';
    const fullKey = `${keyPrefix}${apiKey}`;

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'CREATE',
      resource: 'API_KEY',
      ipAddress: req.ip,
    });

    res.status(201).json({
      apiKey: fullKey,
      name,
      createdAt: new Date(),
      message: 'Save this key - it will not be shown again',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

export const deleteAPIKey = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await createAuditLog({
      adminId: req.admin!.id,
      action: 'DELETE',
      resource: 'API_KEY',
      resourceId: id,
      ipAddress: req.ip,
    });
    res.json({ message: 'API key deleted' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
};

