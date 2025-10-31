import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalLicenses: number;
  activeLicenses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    responseTime: number;
  };
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // For now, calculate from tenants and licenses
      // Later: Create dedicated endpoint
      const [tenantsRes, licensesRes] = await Promise.all([
        api.get('/tenants', { params: { limit: 1 } }),
        api.get('/licenses', { params: { limit: 1 } }),
      ]);
      
      const totalTenants = tenantsRes.data.pagination?.total || 0;
      const activeTenants = tenantsRes.data.tenants?.filter((t: any) => t.isActive).length || 0;
      const totalLicenses = licensesRes.data.pagination?.total || 0;
      const activeLicenses = licensesRes.data.licenses?.filter((l: any) => l.status === 'ACTIVE').length || 0;

      return {
        totalTenants,
        activeTenants,
        totalUsers: 0, // TODO: Create users endpoint
        totalLicenses,
        activeLicenses,
        totalRevenue: 0,
        monthlyRevenue: 0,
        systemHealth: {
          status: 'healthy' as const,
          uptime: 99.9,
          responseTime: 120,
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

