import { request } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import type { SellerProfile } from '../../../types/seller';
import type {
  AuthResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types';

export const register = (payload: RegisterPayload) =>
  request<AuthResponse>({
    url: ENDPOINTS.sellerAuth.register,
    method: 'POST',
    data: payload,
  });

export const login = (payload: LoginPayload) =>
  request<LoginResponse>({
    url: ENDPOINTS.sellerAuth.login,
    method: 'POST',
    data: payload,
  });

export const getMe = () =>
  request<{ seller: SellerProfile }>({
    url: ENDPOINTS.sellerAuth.me,
    method: 'GET',
  });

export const forgotPassword = (payload: ForgotPasswordPayload) =>
  request<void>({
    url: ENDPOINTS.sellerAuth.forgotPassword,
    method: 'POST',
    data: payload,
  });

export const resetPassword = (payload: ResetPasswordPayload) =>
  request<void>({
    url: ENDPOINTS.sellerAuth.resetPassword,
    method: 'POST',
    data: payload,
  });

export const changePassword = (payload: ChangePasswordPayload) =>
  request<{ token: string }>({
    url: ENDPOINTS.sellerAuth.changePassword,
    method: 'POST',
    data: payload,
  });

export const logout = () =>
  request<void>({ url: ENDPOINTS.sellerAuth.logout, method: 'POST' });

export const logoutAll = () =>
  request<void>({ url: ENDPOINTS.sellerAuth.logoutAll, method: 'POST' });
