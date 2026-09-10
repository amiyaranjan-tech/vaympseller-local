import type { SellerProfile } from '../../types/seller';

// "owner" is the full-access account (models/Seller.js). "helper" is an
// owner-created staff login (models/SellerStaff.js) scoped to the same
// shop — see useAuthStore's role field for what it can't see.
export type SellerRole = 'owner' | 'helper';

export interface AuthResponse {
  seller: SellerProfile;
  token: string;
}

export interface LoginResponse extends AuthResponse {
  blockedReason: string | null;
  role: SellerRole;
  staffName: string | null;
}

export interface MeResponse {
  seller: SellerProfile;
  role: SellerRole;
  staffName: string | null;
}

export interface RegisterPayload {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  gstNumber: string;
  businessRegistration: string;
  bank: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
