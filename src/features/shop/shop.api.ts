import { request } from '../../api/client';
import type {
  SellerBank,
  SellerImage,
  SellerProfile,
  SellerWorkingHours,
  ShopStatus,
  ShopStatusMode,
  WorkingDay,
} from '../../types/seller';

// Mirrors validations/sellerShop.validation.js#updateShopSchema on the
// backend — PUT /seller/shop. email/gstNumber/businessRegistration are
// deliberately not editable here (not in that schema). Editing while
// status is "rejected" atomically resubmits it (status -> "pending",
// rejectionReason cleared) — see services/sellerShop.service.js#update;
// no separate "submit for review" call needed, it's automatic.
export interface UpdateShopPayload {
  shopName?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  description?: string;
  logo?: SellerImage;
  cover?: SellerImage;
  workingDays?: WorkingDay[];
  workingHours?: SellerWorkingHours;
  bank?: SellerBank;
}

export async function getShopProfile(): Promise<SellerProfile> {
  const result = await request<{ seller: SellerProfile }>({
    url: '/seller/shop',
    method: 'GET',
  });
  return result.seller;
}

export async function updateShopProfile(payload: UpdateShopPayload): Promise<SellerProfile> {
  const result = await request<{ seller: SellerProfile }>({
    url: '/seller/shop',
    method: 'PUT',
    data: payload,
  });
  return result.seller;
}

// Mirrors validations/sellerShop.validation.js#updateShopStatusSchema —
// PATCH /seller/shop/status. `shopStatus` is only required when
// shopStatusMode is "manual" (a manual open/close override); "auto" lets
// the backend derive status from workingHours instead.
export interface UpdateShopStatusPayload {
  shopStatusMode: ShopStatusMode;
  shopStatus?: ShopStatus;
}

export async function updateShopStatus(payload: UpdateShopStatusPayload): Promise<SellerProfile> {
  const result = await request<{ seller: SellerProfile }>({
    url: '/seller/shop/status',
    method: 'PATCH',
    data: payload,
  });
  return result.seller;
}
