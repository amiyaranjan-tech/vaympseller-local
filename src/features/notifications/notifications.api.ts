import { request } from '../../api/client';
import type { Paginated } from '../../types/api';

// Mirrors models/Notification.js + routes/sellerNotifications.routes.js
// on the backend — confirmed against the real code, not guessed.
export const NOTIFICATION_TYPES = [
  'new_order',
  'order_cancelled',
  'product_approved',
  'product_rejected',
  'low_stock',
  'out_of_stock',
  'return_request',
  'refund_update',
  'payout_completed',
  'verification_update',
  'offer_expiring',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface SellerNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export function getNotifications(
  params: GetNotificationsParams = {},
): Promise<Paginated<SellerNotification>> {
  return request<Paginated<SellerNotification>>({
    url: '/seller/notifications',
    method: 'GET',
    params,
  });
}

export async function getUnreadCount(): Promise<number> {
  const result = await request<{ count: number }>({
    url: '/seller/notifications/unread-count',
    method: 'GET',
  });
  return result.count;
}

export function markNotificationRead(id: string): Promise<SellerNotification> {
  return request<SellerNotification>({
    url: `/seller/notifications/${id}/read`,
    method: 'PATCH',
  });
}

export function markAllNotificationsRead(): Promise<null> {
  return request<null>({ url: '/seller/notifications/read-all', method: 'PATCH' });
}
