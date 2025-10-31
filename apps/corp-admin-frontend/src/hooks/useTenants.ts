import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  productCount: number;
  licenseCount: number;
  activeLicense?: {
    id: string;
    plan: string;
    status: string;
    expiresAt?: string;
  } | null;
}

interface TenantsResponse {
  tenants: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useTenants = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery<TenantsResponse>({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const response = await api.get('/tenants', { params });
      return response.data;
    },
  });
};

