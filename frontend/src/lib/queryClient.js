import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false, // Prevents aggressive refetching
      staleTime: 5 * 60 * 1000,    // Cache data for 5 minutes
    },
  },
});