import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

// Simple TOTP implementation (in production, use otplib)
const generateSecret = () => crypto.randomBytes(20).toString('base32');
const generateOTPAuthUrl = (email: string, secret: string) => {
  const issuer = 'BarcodePOS Control Plane';
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
};

export const setupMFA = async (req: CorpAuthRequest, res: Response) => {
  try {
    const admin = await prisma.corpAdmin.findUnique({ where: { id: req.adminId } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const secret = generateSecret();
    const otpauthUrl = generateOTPAuthUrl(admin.email, secret);

    // Store secret temporarily (user must verify before enabling)
    await prisma.corpAdmin.update({
      where: { id: req.adminId },
      data: { mfaSecret: secret },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'MFA_SETUP',
      resource: 'AUTH',
      ipAddress: req.ip,
    });

    res.json({ secret, otpauthUrl, message: 'Install an authenticator app and scan the QR code' });
  } catch (error) {
    console.error('Setup MFA error:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
};

export const verifyMFA = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const admin = await prisma.corpAdmin.findUnique({ where: { id: req.adminId } });
    if (!admin || !admin.mfaSecret) {
      return res.status(400).json({ error: 'MFA not configured' });
    }

    // TODO: Implement proper TOTP verification with otplib
    // For now, just check if token is provided (placeholder)
    if (!token || token.length !== 6) {
      return res.status(401).json({ error: 'Invalid MFA token' });
    }

    // Enable MFA after successful verification
    await prisma.corpAdmin.update({
      where: { id: req.adminId },
      data: { mfaEnabled: true },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'MFA_ENABLED',
      resource: 'AUTH',
      ipAddress: req.ip,
    });

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('Verify MFA error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
};

export const disableMFA = async (req: CorpAuthRequest, res: Response) => {
  try {
    await prisma.corpAdmin.update({
      where: { id: req.adminId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'MFA_DISABLED',
      resource: 'AUTH',
      ipAddress: req.ip,
    });

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
};

