import { Request, Response, NextFunction } from 'express';
import { permissionsService } from '../services/permissions.service';

/**
 * İzin kontrolü middleware'i
 */
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // İzin kontrolü
    const hasPermission = permissionsService.can(user.role, resource, action);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
        required: { resource, action },
      });
    }

    next();
  };
}

/**
 * Koşullu izin kontrolü middleware'i
 */
export function requireConditionalPermission(
  resource: string,
  action: string,
  getContext: (req: Request) => Record<string, any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const context = getContext(req);
    const hasPermission = permissionsService.canWithConditions(
      user.role,
      user.id,
      resource,
      action,
      context
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Admin kontrolü
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Admin access required',
    });
  }

  next();
}

