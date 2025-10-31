import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useSettings = (category?: string) => {
  return useQuery({
    queryKey: ['settings', category],
    queryFn: async () => {
      const url = category ? `/settings/${category}` : '/settings';
      const response = await api.get(url);
      return response.data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, settings }: { category: string; settings: any }) => {
      const response = await api.patch(`/settings/${category}`, { settings });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.category] });
    },
  });
};

