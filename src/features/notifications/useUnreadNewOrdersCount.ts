import { useQuery } from '@tanstack/react-query';

import { getNotifications } from './notifications.api';

// Drives the Orders bottom-tab badge (see MainNavigator.tsx) — scoped to
// just `new_order` notifications, not the general unread count
// useUnreadCount.ts already covers for the bell icon. No backend
// unread-count-by-type endpoint exists, so this fetches unread
// notifications and filters client-side; staleTime is short (not 30s
// like the bell's count) since a badge that's meant to reflect "a new
// order just came in" should update quickly once
// notificationService.ts's foreground-push handler invalidates this
// query key.
export function useUnreadNewOrdersCount() {
  const query = useQuery({
    queryKey: ['seller-notifications', 'unread-new-orders'],
    queryFn: () => getNotifications({ isRead: false, limit: 100 }),
    staleTime: 5000,
  });

  return (query.data?.items ?? []).filter(n => n.type === 'new_order').length;
}
