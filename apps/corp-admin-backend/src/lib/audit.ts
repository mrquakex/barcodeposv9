import prisma from './prisma.js';

interface CreateAuditLogParams {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit failures shouldn't break the main operation
  }
};

