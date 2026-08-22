import axios, { type AxiosError } from 'axios';
import Config from 'react-native-config';

import { getToken, clearToken } from '../utils/tokenStorage';
import { useAuthStore } from '../store/useAuthStore';
import { ApiError, type ApiEnvelope } from '../types/api';
import { resetToAuth } from '../navigation/navigationRef';

// Falls back to a `localhost` default (paired with `adb reverse tcp:5000
// tcp:5000`) if react-native-config's native wiring isn't linked yet in a
// given build — see .env.example. Works for both the emulator and a
// USB-connected physical device via adb reverse; an emulator without
// reverse set up needs 10.0.2.2 instead (see .env.example for the tradeoffs).
const baseURL = Config.API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 20000,
});

apiClient.interceptors.request.use(async config => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // Only an expired/invalidated *session* should clear state and bounce
    // to Auth — a 401 on the login/register call itself (wrong password)
    // is just a rejected credential and must surface as a normal form
    // error instead of resetting navigation out from under the user.
    if (status === 401 && error.config?.headers?.Authorization) {
      await clearToken();
      useAuthStore.getState().clearSession();
      resetToAuth();
    }

    return Promise.reject(new ApiError(message, status));
  },
);

// Every endpoint function calls this instead of apiClient directly, so the
// envelope-unwrapping (`.data.data`) lives in exactly one place.
export async function request<T>(
  config: Parameters<typeof apiClient.request>[0],
): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  return response.data.data;
}
