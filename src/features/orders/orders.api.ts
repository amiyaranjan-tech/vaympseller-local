import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/orders contract not confirmed yet.
export type OrderFulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderFulfillmentStatus;
  total: number;
  createdAt: string;
}

export async function getOrders(): Promise<Order[]> {
  throw new NotImplementedError('GET /seller/orders');
}

export async function getOrder(_id: string): Promise<Order> {
  throw new NotImplementedError('GET /seller/orders/:id');
}

export async function updateOrderStatus(
  _id: string,
  _status: OrderFulfillmentStatus,
): Promise<Order> {
  throw new NotImplementedError('PATCH /seller/orders/:id/status');
}
