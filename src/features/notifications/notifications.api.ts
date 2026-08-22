import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/notifications contract not confirmed yet.
export interface SellerNotification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<SellerNotification[]> {
  throw new NotImplementedError('GET /seller/notifications');
}

export async function markNotificationRead(_id: string): Promise<void> {
  throw new NotImplementedError('PATCH /seller/notifications/:id/read');
}
