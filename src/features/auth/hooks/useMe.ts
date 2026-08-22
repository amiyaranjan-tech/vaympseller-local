import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../../store/useAuthStore';
import * as authApi from '../api/auth.api';

// Refetches the seller profile on mount to confirm the cached one (shown
// instantly from persisted Zustand state) is still accurate — status may
// have changed server-side (verified, suspended, ...) since last launch.
export function useMe() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const updateSeller = useAuthStore(state => state.updateSeller);

  const query = useQuery({
    queryKey: ['seller-auth', 'me'],
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      updateSeller(query.data.seller);
    }
  }, [query.data, updateSeller]);

  return query;
}
