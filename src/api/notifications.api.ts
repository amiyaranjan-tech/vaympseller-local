import { request } from './client';
import { ENDPOINTS } from './endpoints';

export interface RegisterDevicePayload {
  token: string;
  platform: 'android' | 'ios' | 'web';
  app: 'SELLER';
}

export const registerDeviceToken = (payload: RegisterDevicePayload) =>
  request<null>({
    url: ENDPOINTS.sellerNotifications.registerDevice,
    method: 'POST',
    data: payload,
  });

export const unregisterDeviceToken = (token: string) =>
  request<null>({
    url: ENDPOINTS.sellerNotifications.unregisterDevice,
    method: 'POST',
    data: { token },
  });
