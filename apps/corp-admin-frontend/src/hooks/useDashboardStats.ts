import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashboardStatsResponse {
  stats: {
    tenants: {
      total: number;
      active: number;
      inactive: number;
      growth: number;
    };
    licenses: {
      total: number;
      active: number;
      expired: number;
      expiringSoon: number;
    };
    users: {
      total: number;
      active: number;
      inactive: number;
    };
    audit: {
      total: number;
    };
  };
  recentActivities: any[];
  expiringLicenses: any[];
}

export const useDashboardStats = () => {
  return useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useDashboardActivities = (limit: number = 20) => {
  return useQuery({
    queryKey: ['dashboard', 'activities', limit],
    queryFn: async () => {
      const response = await api.get('/dashboard/activities', { params: { limit } });
      return response.data;
    },
    refetchInterval: 30000,
  });
};

