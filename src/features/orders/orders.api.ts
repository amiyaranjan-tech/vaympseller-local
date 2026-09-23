import { request } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import type { Paginated } from '../../types/api';

// Mirrors constants/sellerFulfillmentStatus.js's STATUSES on the backend
// exactly (confirmed against services/sellerOrder.service.js).
export type OrderFulfillmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  product: string | null;
  name: string;
  brand: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  isFreeItem: boolean;
  dealType: string | null;
}

export interface OrderRider {
  _id: string;
  name: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'cycle';
  vehicleNumber: string;
}

export interface OrderFulfillment {
  sellerStatus: OrderFulfillmentStatus;
  courier: string;
  trackingNumber: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string;
  // Set on Confirm (+5 min); the backend scheduler flips the order to
  // Packed once it passes.
  autoPackAt: string | null;
  // Populated once a rider has accepted (see notify-rider/accept on the
  // backend); a bare id would mean it wasn't populated, which shouldn't
  // happen through this API's own endpoints.
  rider: OrderRider | null;
  riderOfferedAt: string | null;
  riderAcceptedAt: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  fulfillment: OrderFulfillment;
  subtotal: number;
  tierDiscount: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  sellerStatus?: OrderFulfillmentStatus;
  from?: string;
  to?: string;
}

export function getOrders(params: GetOrdersParams = {}): Promise<Paginated<Order>> {
  return request<Paginated<Order>>({
    url: ENDPOINTS.sellerOrders.list,
    method: 'GET',
    params,
  });
}

export function getOrder(id: string): Promise<Order> {
  return request<Order>({ url: ENDPOINTS.sellerOrders.detail(id), method: 'GET' });
}

interface UpdateOrderStatusPayload {
  sellerStatus: OrderFulfillmentStatus;
  courier?: string;
  trackingNumber?: string;
  cancellationReason?: string;
}

export function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<Order> {
  return request<Order>({
    url: ENDPOINTS.sellerOrders.status(id),
    method: 'PATCH',
    data: payload,
  });
}

// Thin, named wrappers over updateOrderStatus for the two actions actually
// exposed on OrderDetailScreen — same endpoint, just clearer call sites
// than spelling out the sellerStatus string inline everywhere.
export function acceptOrder(id: string): Promise<Order> {
  return updateOrderStatus(id, { sellerStatus: 'Confirmed' });
}

export function rejectOrder(id: string, reason: string): Promise<Order> {
  return updateOrderStatus(id, { sellerStatus: 'Cancelled', cancellationReason: reason });
}

export interface NotifyRiderResult {
  order: Order;
  ridersNotified: number;
}

export function notifyRider(id: string): Promise<NotifyRiderResult> {
  return request<NotifyRiderResult>({
    url: ENDPOINTS.sellerOrders.notifyRider(id),
    method: 'POST',
  });
}
