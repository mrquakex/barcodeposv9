import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useSecurityEvents = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['security-audit', 'events', params],
    queryFn: async () => {
      const response = await api.get('/security-audit/events', { params });
      return response.data;
    },
  });
};

export const useFailedLogins = () => {
  return useQuery({
    queryKey: ['security-audit', 'failed-logins'],
    queryFn: async () => {
      const response = await api.get('/security-audit/failed-logins');
      return response.data;
    },
  });
};

export const useSuspiciousActivity = () => {
  return useQuery({
    queryKey: ['security-audit', 'suspicious'],
    queryFn: async () => {
      const response = await api.get('/security-audit/suspicious');
      return response.data;
    },
  });
};

