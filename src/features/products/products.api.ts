import { request } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import type { Paginated } from '../../types/api';

// Mirrors models/Product.js on the backend exactly (confirmed against
// controllers/sellerProduct.controller.js + validations/sellerProduct.validation.js).
export type ProductStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'hidden'
  | 'archived';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type ProductGender = 'men' | 'women' | 'kids' | 'unisex';

export interface ProductVariant {
  size: string;
  color?: string;
  sku?: string;
  stock: number;
}

export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  group: string[];
  subcategory: string;
  gender: ProductGender;
  tags: string[];
  productCollection: string;
  seller: string;
  // Admin-created products only — a seller submits sellerPrice instead
  // (see ProductPayload) and never sees/sets this.
  costPrice?: number;
  sellingPrice: number;
  // What the seller is actually paid, distinct from the buyer-facing
  // finalPrice — see backend's models/Product.js#computeDerivedFields.
  sellerPrice?: number;
  discountPercent: number;
  // >=50% discount, computed server-side from the same threshold the
  // admin panel and storefront use (constants/massiveDeal.js on the
  // backend) — never set directly, never edit locally.
  isMassiveDeal: boolean;
  finalPrice: number;
  variants: ProductVariant[];
  totalStock: number;
  stockStatus: StockStatus;
  color: string;
  season: string;
  attributes: Record<string, string>;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isLimitedStock: boolean;
  isBogo: boolean;
  tryAndBuy: boolean;
  isReturnable: boolean;
  dealType: 'none' | 'bogo' | 'tier_amount' | 'tier_percentage' | 'free_shipping';
  salesCount: number;
  wishlistCount: number;
  images: ProductImage[];
  video: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

// Everything the seller can set on create/update — matches
// createSellerProductSchema (Joi). `status` isn't included: creation
// always starts at "draft" server-side, and status only moves via
// updateProductStatus (PATCH /:id/status).
export interface ProductPayload {
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  sellingPrice: number;
  sellerPrice: number;
  description?: string;
  group?: string[];
  gender?: ProductGender;
  tags?: string[];
  productCollection?: string;
  variants?: ProductVariant[];
  color?: string;
  season?: string;
  attributes?: Record<string, string>;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isLimitedStock?: boolean;
  isBogo?: boolean;
  tryAndBuy?: boolean;
  isReturnable?: boolean;
  dealType?: Product['dealType'];
  images?: ProductImage[];
  video?: string;
}

// Only draft -> pending_review/archived, pending_review -> draft,
// rejected -> draft, approved -> published, published -> hidden/archived,
// hidden -> published/archived are seller-initiated (see
// constants/productStatus.js SELLER_ALLOWED_TRANSITIONS on the backend).
// approved/rejected only ever get set by an admin reviewing the product.
export type SellerSettableStatus = 'draft' | 'pending_review' | 'archived' | 'published' | 'hidden';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  stockStatus?: StockStatus;
}

export function getProducts(params: GetProductsParams = {}): Promise<Paginated<Product>> {
  return request<Paginated<Product>>({
    url: ENDPOINTS.sellerProducts.list,
    method: 'GET',
    params,
  });
}

export function getProduct(id: string): Promise<Product> {
  return request<Product>({ url: ENDPOINTS.sellerProducts.detail(id), method: 'GET' });
}

export function createProduct(payload: ProductPayload): Promise<Product> {
  return request<Product>({
    url: ENDPOINTS.sellerProducts.list,
    method: 'POST',
    data: payload,
  });
}

export function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<Product> {
  return request<Product>({
    url: ENDPOINTS.sellerProducts.detail(id),
    method: 'PUT',
    data: payload,
  });
}

export function deleteProduct(id: string): Promise<null> {
  return request<null>({ url: ENDPOINTS.sellerProducts.detail(id), method: 'DELETE' });
}

export function updateProductStatus(
  id: string,
  status: SellerSettableStatus,
): Promise<Product> {
  return request<Product>({
    url: ENDPOINTS.sellerProducts.status(id),
    method: 'PATCH',
    data: { status },
  });
}
