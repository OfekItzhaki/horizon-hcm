import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(
    async (queryKey: unknown[], queryFn: () => Promise<unknown>) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient]
  );

  const prefetchOnHover = useCallback(
    (queryKey: unknown[], queryFn: () => Promise<unknown>) => {
      return {
        onMouseEnter: () => prefetchQuery(queryKey, queryFn),
        onFocus: () => prefetchQuery(queryKey, queryFn),
      };
    },
    [prefetchQuery]
  );

  return { prefetchQuery, prefetchOnHover };
}
