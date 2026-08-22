import type { SellerProfile } from '../../types/seller';

export interface AuthResponse {
  seller: SellerProfile;
  token: string;
}

export interface LoginResponse extends AuthResponse {
  blockedReason: string | null;
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
