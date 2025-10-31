import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

// Permission definitions
export const PERMISSIONS = {
  // Tenants
  TENANTS_VIEW: 'tenants:view',
  TENANTS_CREATE: 'tenants:create',
  TENANTS_UPDATE: 'tenants:update',
  TENANTS_DELETE: 'tenants:delete',
  // Licenses
  LICENSES_VIEW: 'licenses:view',
  LICENSES_CREATE: 'licenses:create',
  LICENSES_UPDATE: 'licenses:update',
  LICENSES_DELETE: 'licenses:delete',
  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  // Billing
  BILLING_VIEW: 'billing:view',
  BILLING_CREATE: 'billing:create',
  BILLING_UPDATE: 'billing:update',
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  // Security
  SECURITY_AUDIT_VIEW: 'security:audit:view',
  MFA_MANAGE: 'security:mfa:manage',
  // System
  SYSTEM_HEALTH_VIEW: 'system:health:view',
};

// Role templates
export const ROLE_TEMPLATES = {
  CORP_ADMIN: Object.values(PERMISSIONS),
  CORP_OPS: [
    PERMISSIONS.TENANTS_VIEW,
    PERMISSIONS.TENANTS_CREATE,
    PERMISSIONS.TENANTS_UPDATE,
    PERMISSIONS.LICENSES_VIEW,
    PERMISSIONS.LICENSES_CREATE,
    PERMISSIONS.LICENSES_UPDATE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.SYSTEM_HEALTH_VIEW,
  ],
  CORP_SUPPORT: [
    PERMISSIONS.TENANTS_VIEW,
    PERMISSIONS.LICENSES_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

export const getPermissions = async (req: CorpAuthRequest, res: Response) => {
  try {
    const role = req.adminRole || 'CORP_SUPPORT';
    const permissions = ROLE_TEMPLATES[role as keyof typeof ROLE_TEMPLATES] || ROLE_TEMPLATES.CORP_SUPPORT;
    
    res.json({
      role,
      permissions,
      allPermissions: Object.values(PERMISSIONS),
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const getRoleTemplates = async (req: CorpAuthRequest, res: Response) => {
  try {
    res.json({
      templates: ROLE_TEMPLATES,
      allPermissions: Object.values(PERMISSIONS),
    });
  } catch (error) {
    console.error('Get role templates error:', error);
    res.status(500).json({ error: 'Failed to fetch role templates' });
  }
};

export const checkPermission = (permission: string) => {
  return (req: CorpAuthRequest, res: Response, next: any) => {
    const role = req.adminRole || 'CORP_SUPPORT';
    const permissions = ROLE_TEMPLATES[role as keyof typeof ROLE_TEMPLATES] || ROLE_TEMPLATES.CORP_SUPPORT;
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

