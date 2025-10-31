import { Request, Response, NextFunction } from 'express';

// Simple response compression (in production, use express-compression)
export const compressResponse = (req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    // In production, use express-compression middleware
    // This is a placeholder
    res.setHeader('Content-Encoding', 'gzip');
  }
  
  next();
};

