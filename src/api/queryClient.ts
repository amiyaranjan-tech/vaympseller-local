import { QueryClient } from '@tanstack/react-query';

// Single shared instance — App.tsx wires it into QueryClientProvider,
// notificationService.ts needs the same one to invalidate the seller
// notifications cache when a push is tapped from a killed/backgrounded
// state (no component tree, so no useQueryClient() available there).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});
