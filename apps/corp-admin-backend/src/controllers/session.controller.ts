import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

// In-memory session store (in production, use Redis)
const activeSessions = new Map<string, { adminId: string; createdAt: Date; ipAddress: string; userAgent: string }>();

export const getMySessions = async (req: CorpAuthRequest, res: Response) => {
  try {
    const sessions = Array.from(activeSessions.entries())
      .filter(([_, session]) => session.adminId === req.adminId)
      .map(([token, session]) => ({
        token: token.substring(0, 8) + '...',
        createdAt: session.createdAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isCurrent: false, // Would need to compare with current token
      }));

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const logoutAllSessions = async (req: CorpAuthRequest, res: Response) => {
  try {
    // Remove all sessions for this admin
    for (const [token, session] of activeSessions.entries()) {
      if (session.adminId === req.adminId) {
        activeSessions.delete(token);
      }
    }

    res.json({ message: 'All sessions logged out' });
  } catch (error) {
    console.error('Logout all sessions error:', error);
    res.status(500).json({ error: 'Failed to logout all sessions' });
  }
};

export const revokeSession = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    // In production, would invalidate JWT token
    activeSessions.delete(token);
    res.json({ message: 'Session revoked' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

