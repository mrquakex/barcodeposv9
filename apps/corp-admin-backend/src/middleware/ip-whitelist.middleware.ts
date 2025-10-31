import { Request, Response, NextFunction } from 'express';

// In-memory IP whitelist (in production, use database)
const ipWhitelist: string[] = [];

export const checkIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.socket.remoteAddress || '';
  
  // If whitelist is empty, allow all (whitelist disabled)
  if (ipWhitelist.length === 0) {
    return next();
  }

  // Check if IP is whitelisted
  if (!ipWhitelist.includes(clientIP)) {
    return res.status(403).json({ error: 'IP address not allowed' });
  }

  next();
};

export const addToWhitelist = (ip: string) => {
  if (!ipWhitelist.includes(ip)) {
    ipWhitelist.push(ip);
  }
};

export const removeFromWhitelist = (ip: string) => {
  const index = ipWhitelist.indexOf(ip);
  if (index > -1) {
    ipWhitelist.splice(index, 1);
  }
};

export const getWhitelist = () => [...ipWhitelist];

