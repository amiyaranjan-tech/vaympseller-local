import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/offers contract not confirmed yet.
export type OfferType = 'discount' | 'bogo' | 'tiered';

export interface Offer {
  _id: string;
  type: OfferType;
  title: string;
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export async function getOffers(): Promise<Offer[]> {
  throw new NotImplementedError('GET /seller/offers');
}

export async function createOffer(
  _payload: Omit<Offer, '_id' | 'isActive'>,
): Promise<Offer> {
  throw new NotImplementedError('POST /seller/offers');
}
