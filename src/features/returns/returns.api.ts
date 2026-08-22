import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/returns contract not confirmed yet.
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

export interface ReturnRequest {
  _id: string;
  orderId: string;
  productId: string;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
}

export async function getReturns(): Promise<ReturnRequest[]> {
  throw new NotImplementedError('GET /seller/returns');
}

export async function resolveReturn(
  _id: string,
  _status: Extract<ReturnStatus, 'approved' | 'rejected'>,
): Promise<ReturnRequest> {
  throw new NotImplementedError('PATCH /seller/returns/:id');
}
