import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/support contract not confirmed yet.
export interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  throw new NotImplementedError('GET /seller/support');
}

export async function createSupportTicket(
  _payload: Pick<SupportTicket, 'subject' | 'message'>,
): Promise<SupportTicket> {
  throw new NotImplementedError('POST /seller/support');
}
