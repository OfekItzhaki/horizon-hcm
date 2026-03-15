import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared';
import { queryKeys } from '../lib/query-keys';

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: async () => {
      const response = await buildingsApi.getAll();
      // API now returns { data: [...], total, page } — unwrap the array
      const payload = response.data as any;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    },
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
}
