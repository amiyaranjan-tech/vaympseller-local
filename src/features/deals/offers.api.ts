import { request } from '../../api/client';
import type { Paginated } from '../../types/api';

// Mirrors models/Offer.js + validations/offer.validation.js on the
// backend, scoped through /api/v1/seller/offers (routes/sellerOffers.
// routes.js -> controllers/sellerOffer.controller.js). Confirmed against
// the actual backend code, not guessed from field names.
export type OfferType = 'bogo' | 'tier_amount' | 'tier_percentage' | 'free_shipping';
export type OfferScope = 'entire_shop' | 'selected_products';

export interface OfferProductRef {
  _id: string;
  name: string;
  images: { url: string; publicId: string; alt?: string }[];
  sellingPrice: number;
  finalPrice: number;
  dealType: string;
}

export interface Offer {
  _id: string;
  title: string;
  description: string;
  type: OfferType;
  scope: OfferScope;
  products: OfferProductRef[];
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  freeProductIds?: string[];
  maximumFreeItems?: number | null;
  maximumDiscount?: number | null;
  seller: string;
  minSpend?: number;
  discountAmount?: number;
  discountPercent?: number;
  maxUses?: number | null;
  usedCount: number;
  isEnabled: boolean;
  startDate: string;
  endDate: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// Do not send `seller` or `type` — the seller controller force-sets
// `seller: req.seller.id` and `type: "bogo"` regardless of body.
export interface BogoOfferPayload {
  title: string;
  description?: string;
  scope?: OfferScope;
  products: string[];
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  // The "free item" pool — which product(s) the customer actually
  // receives free/discounted. Left empty, the backend gives away the
  // same product being bought; set this to offer a different
  // ("suggested") product instead.
  freeProductIds?: string[];
  maximumFreeItems?: number | null;
  isEnabled?: boolean;
  startDate: string;
  endDate: string;
}

// `type` IS required here (unlike bogo) — tier_amount/tier_percentage/
// free_shipping all post to the same /tier endpoint.
export interface TierOfferPayload {
  title: string;
  description?: string;
  type: Exclude<OfferType, 'bogo'>;
  scope?: OfferScope;
  products: string[];
  minSpend: number;
  discountAmount?: number;
  discountPercent?: number;
  maximumDiscount?: number | null;
  maxUses?: number | null;
  isEnabled?: boolean;
  startDate: string;
  endDate: string;
}

export interface GetOffersParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: OfferType;
  isEnabled?: boolean;
}

export function getOffers(params: GetOffersParams = {}): Promise<Paginated<Offer>> {
  return request<Paginated<Offer>>({ url: '/seller/offers', method: 'GET', params });
}

export function getOffer(id: string): Promise<Offer> {
  return request<Offer>({ url: `/seller/offers/${id}`, method: 'GET' });
}

export function createBogoOffer(payload: BogoOfferPayload): Promise<Offer> {
  return request<Offer>({ url: '/seller/offers/bogo', method: 'POST', data: payload });
}

export function updateBogoOffer(id: string, payload: Partial<BogoOfferPayload>): Promise<Offer> {
  return request<Offer>({ url: `/seller/offers/bogo/${id}`, method: 'PUT', data: payload });
}

export function createTierOffer(payload: TierOfferPayload): Promise<Offer> {
  return request<Offer>({ url: '/seller/offers/tier', method: 'POST', data: payload });
}

export function updateTierOffer(id: string, payload: Partial<TierOfferPayload>): Promise<Offer> {
  return request<Offer>({ url: `/seller/offers/tier/${id}`, method: 'PUT', data: payload });
}

export function updateOfferStatus(id: string, isEnabled: boolean): Promise<Offer> {
  return request<Offer>({ url: `/seller/offers/${id}/status`, method: 'PATCH', data: { isEnabled } });
}

export function deleteOffer(id: string): Promise<null> {
  return request<null>({ url: `/seller/offers/${id}`, method: 'DELETE' });
}
