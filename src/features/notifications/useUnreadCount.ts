import { useQuery } from '@tanstack/react-query';

import { getUnreadCount } from './notifications.api';

// Shared by every screen showing a bell-icon badge (Dashboard, Shop, ...)
// so they all agree on the same cached count instead of each re-deriving
// it from a full notification list.
export function useUnreadNotificationsCount() {
  const query = useQuery({
    queryKey: ['seller-notifications', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: 30000,
  });
  return query.data ?? 0;
}
