import { NotImplementedError } from '../../utils/NotImplementedError';

// Best-effort shape from field names named in the brief — NOT confirmed
// against the real backend contract yet (/api/v1/seller/products is still
// being built). Expect this to need a small diff once it lands, not a
// rewrite: request() usage below already matches every other feature's
// call convention.
export type ProductStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'hidden'
  | 'archived';

export interface ProductVariant {
  size: string;
  color?: string;
  stock: number;
  sku?: string;
}

export interface Product {
  _id: string;
  name: string;
  brand: string;
  description: string;
  tags: string[];
  attributes: Record<string, string>;
  color: string;
  season: string;
  gender: string;
  category: string;
  subcategory: string;
  variants: ProductVariant[];
  costPrice: number;
  sellingPrice: number;
  discountPercent: number;
  finalPrice: number;
  isReturnable: boolean;
  tryAndBuy: boolean;
  isBogo: boolean;
  images: string[];
  video?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductPayload = Omit<
  Product,
  '_id' | 'finalPrice' | 'status' | 'createdAt' | 'updatedAt'
>;

export async function getProducts(): Promise<Product[]> {
  throw new NotImplementedError('GET /seller/products');
}

export async function getProduct(_id: string): Promise<Product> {
  throw new NotImplementedError('GET /seller/products/:id');
}

export async function createProduct(_payload: CreateProductPayload): Promise<Product> {
  throw new NotImplementedError('POST /seller/products');
}

export async function updateProduct(
  _id: string,
  _payload: Partial<CreateProductPayload>,
): Promise<Product> {
  throw new NotImplementedError('PATCH /seller/products/:id');
}

export async function deleteProduct(_id: string): Promise<void> {
  throw new NotImplementedError('DELETE /seller/products/:id');
}
