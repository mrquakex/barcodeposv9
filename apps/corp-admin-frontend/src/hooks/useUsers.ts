import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useUsers = (params?: { page?: number; limit?: number; search?: string; tenantId?: string }) => {
  return useQuery<UsersResponse>({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await api.get('/users', { params });
      return response.data;
    },
  });
};

