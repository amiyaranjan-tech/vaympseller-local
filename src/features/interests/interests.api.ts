import { request } from '../../api/client';
import type { ProductImage } from '../products/products.api';

// Mirrors routes/sellerProductInterest.routes.js — customers who tapped
// "Interested" on this seller's products in the consumer app/website.
export interface InterestedProduct {
  product: {
    _id: string;
    name: string;
    images: ProductImage[];
    finalPrice: number;
    sellingPrice: number;
    status: string;
  };
  count: number;
  lastInterestAt: string;
}

export interface InterestedCustomer {
  _id: string;
  customer: { _id: string; name?: string; phone?: string; email?: string };
  priceAtInterest: number | null;
  interestedAt: string;
}

export function getInterestedProducts(): Promise<InterestedProduct[]> {
  return request<InterestedProduct[]>({ url: '/seller/product-interests', method: 'GET' });
}

export function getInterestedCustomers(productId: string): Promise<InterestedCustomer[]> {
  return request<InterestedCustomer[]>({ url: `/seller/product-interests/${productId}`, method: 'GET' });
}
