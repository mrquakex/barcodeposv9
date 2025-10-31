import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Simple TOTP implementation (in production, use otplib)
const generateSecret = () => crypto.randomBytes(20).toString('base32');
const generateOTPAuthUrl = (email: string, secret: string) => {
  const issuer = 'BarcodePOS';
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
};

export const setupMFA = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const secret = generateSecret();
    const otpauthUrl = generateOTPAuthUrl(user.email, secret);

    // Store secret temporarily (user must verify before enabling)
    await prisma.user.update({
      where: { id: req.userId },
      data: { mfaSecret: secret },
    });

    res.json({ secret, otpauthUrl, message: 'Install an authenticator app and scan the QR code' });
  } catch (error) {
    console.error('Setup MFA error:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
};

export const verifyMFA = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not configured' });
    }

    // TODO: Implement proper TOTP verification with otplib
    // For now, just check if token is provided (placeholder)
    if (!token || token.length !== 6) {
      return res.status(401).json({ error: 'Invalid MFA token' });
    }

    // Enable MFA after successful verification
    await prisma.user.update({
      where: { id: req.userId },
      data: { mfaEnabled: true },
    });

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('Verify MFA error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
};

export const disableMFA = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
};

