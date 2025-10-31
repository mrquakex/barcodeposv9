import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  admin?: {
    id: string;
    email: string;
    name: string;
  };
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useAuditLogs = (params?: {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await api.get('/audit-logs', { params });
      return response.data;
    },
  });
};

