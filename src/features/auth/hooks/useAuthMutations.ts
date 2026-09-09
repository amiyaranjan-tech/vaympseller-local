import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setToken, clearToken } from '../../../utils/tokenStorage';
import { useAuthStore } from '../../../store/useAuthStore';
import { unregisterCurrentDevice } from '../../../services/notifications/notificationService';
import * as authApi from '../api/auth.api';
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types';

export function useLogin() {
  const setSession = useAuthStore(state => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async result => {
      await setToken(result.token);
      setSession(result.seller);
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore(state => state.setSession);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: async result => {
      await setToken(result.token);
      setSession(result.seller);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authApi.resetPassword(payload),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApi.changePassword(payload),
    onSuccess: async result => {
      await setToken(result.token);
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore(state => state.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      // Must run before clearToken() below — it still needs a valid token
      // to authenticate the unregister call itself.
      await unregisterCurrentDevice();
      await clearToken();
      clearSession();
      queryClient.clear();
    },
  });
}

export function useLogoutAll() {
  const clearSession = useAuthStore(state => state.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSettled: async () => {
      await unregisterCurrentDevice();
      await clearToken();
      clearSession();
      queryClient.clear();
    },
  });
}
