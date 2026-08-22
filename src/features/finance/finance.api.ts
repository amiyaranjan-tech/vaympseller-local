import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/finance contract not confirmed yet.
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Payout {
  _id: string;
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface FinanceSummary {
  availableBalance: number;
  pendingBalance: number;
  commissionRate: number | null;
  payouts: Payout[];
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  throw new NotImplementedError('GET /seller/finance');
}
