import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/Toast';

interface OptimisticUpdateOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: unknown[];
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdate<TData, TVariables>({
  mutationFn,
  queryKey,
  updateFn,
  successMessage,
  errorMessage,
}: OptimisticUpdateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(queryKey, (old) => updateFn(old, variables));

      // Return context with snapshot
      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      showError(errorMessage || 'Operation failed');
      console.error('Optimistic update error:', error);
    },
    onSuccess: () => {
      if (successMessage) {
        showSuccess(successMessage);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
