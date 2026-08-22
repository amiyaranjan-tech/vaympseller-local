import { NotImplementedError } from '../../utils/NotImplementedError';

import type { SellerProfile, SellerWorkingHours, WorkingDay } from '../../types/seller';

// /api/v1/seller/shop contract not confirmed yet — this is the
// shop-profile-edit surface (logo/cover/hours/description), distinct from
// seller-auth's /me (read-only session bootstrap).
export type ShopProfileUpdatePayload = Partial<
  Pick<
    SellerProfile,
    'shopName' | 'description' | 'shopStatusMode'
  >
> & {
  workingDays?: WorkingDay[];
  workingHours?: SellerWorkingHours;
};

export async function updateShopProfile(
  _payload: ShopProfileUpdatePayload,
): Promise<SellerProfile> {
  throw new NotImplementedError('PATCH /seller/shop');
}

export async function uploadShopImage(
  _kind: 'logo' | 'cover',
  _fileUri: string,
): Promise<{ url: string; publicId: string }> {
  throw new NotImplementedError('POST /seller/uploads/sign');
}
