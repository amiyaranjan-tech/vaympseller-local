import { NotImplementedError } from '../../utils/NotImplementedError';

// /api/v1/seller/inventory contract not confirmed yet.
export interface InventoryItem {
  productId: string;
  variantSku: string;
  size: string;
  stock: number;
  lowStockThreshold: number;
}

export async function getInventory(): Promise<InventoryItem[]> {
  throw new NotImplementedError('GET /seller/inventory');
}

export async function updateStock(_variantSku: string, _stock: number): Promise<InventoryItem> {
  throw new NotImplementedError('PATCH /seller/inventory/:variantSku');
}
