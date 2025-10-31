import { Request, Response, NextFunction } from 'express';
import { logPerformance, logError } from '../lib/monitoring.js';

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logPerformance({
      endpoint: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date(),
    });
  });
  
  next();
};

export const errorMonitoringMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const severity = res.statusCode >= 500 ? 'high' : res.statusCode >= 400 ? 'medium' : 'low';
  
  logError(err, {
    path: req.path,
    method: req.method,
    statusCode: res.statusCode,
    body: req.body,
    query: req.query,
  }, severity);
  
  next(err);
};

