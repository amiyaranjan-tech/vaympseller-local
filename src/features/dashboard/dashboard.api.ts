import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/dashboard contract not confirmed yet — shape is a guess
// from the seller profile fields (revenue/orders/returns/refunds/products)
// already verified in the auth response.
export interface DashboardSummary {
  revenue: number;
  orders: number;
  returns: number;
  refunds: number;
  products: number;
  pendingOrders: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  throw new NotImplementedError('GET /seller/dashboard');
}
