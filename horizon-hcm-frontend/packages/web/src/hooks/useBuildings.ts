import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared';
import { queryKeys } from '../lib/query-keys';

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: async () => {
      const response = await buildingsApi.getAll();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBuilding(id: string | null) {
  return useQuery({
    queryKey: queryKeys.buildings.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const response = await buildingsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
