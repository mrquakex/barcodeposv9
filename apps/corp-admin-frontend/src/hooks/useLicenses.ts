import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface License {
  id: string;
  tenantId: string;
  status: string;
  plan: string;
  includesMobile: boolean;
  trial: boolean;
  startsAt: string;
  expiresAt?: string;
  tenant?: {
    id: string;
    name: string;
  };
}

interface LicensesResponse {
  licenses: License[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useLicenses = (params?: { page?: number; limit?: number; status?: string; tenantId?: string }) => {
  return useQuery<LicensesResponse>({
    queryKey: ['licenses', params],
    queryFn: async () => {
      const response = await api.get('/licenses', { params });
      return response.data;
    },
  });
};

