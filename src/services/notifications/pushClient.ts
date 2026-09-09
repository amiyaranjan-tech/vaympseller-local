import {
  getMessaging,
  getToken as getMessagingToken,
  onTokenRefresh as onMessagingTokenRefresh,
  onMessage as onMessagingMessage,
  onNotificationOpenedApp as onMessagingNotificationOpenedApp,
  getInitialNotification as getMessagingInitialNotification,
} from '@react-native-firebase/messaging';

import type { RemoteMessage } from '@react-native-firebase/messaging';

export type { RemoteMessage };

/**
 * ==========================================
 * Push Client — thin wrapper around @react-native-firebase/messaging
 * ==========================================
 *
 * Ported verbatim from the Consumer app's own pushClient.ts — v26's
 * modular API shape (getMessaging()/getToken(messaging)/... as named
 * functions, not the older namespaced messaging().getToken()) is only
 * touched here, so a future major version bump only needs updating this
 * file.
 *
 * Every method is guarded so a native-module hiccup (a device without Play
 * Services, a fresh install before the Gradle plugin has been picked up by
 * a stale build, etc.) is caught and logged, never thrown. Callers
 * (notificationService.ts) never touch the SDK directly, only these
 * functions.
 */

const messaging = () => getMessaging();

export async function getToken(): Promise<string | null> {
  try {
    return await getMessagingToken(messaging());
  } catch (error) {
    console.log('[pushClient] getToken failed', error);
    return null;
  }
}

// No requestPermission here — @react-native-firebase/messaging's version is
// a hard no-op on Android (see notificationPermissions.ts's own doc
// comment for why react-native-permissions' requestNotifications() is used
// instead).

/** Returns an unsubscribe function, or a no-op if wiring it up failed. */
export function onTokenRefresh(callback: (token: string) => void): () => void {
  try {
    return onMessagingTokenRefresh(messaging(), callback);
  } catch (error) {
    console.log('[pushClient] onTokenRefresh failed', error);
    return () => {};
  }
}

/** Foreground message handler — returns an unsubscribe function. */
export function onMessage(callback: (message: RemoteMessage) => void): () => void {
  try {
    return onMessagingMessage(messaging(), callback);
  } catch (error) {
    console.log('[pushClient] onMessage failed', error);
    return () => {};
  }
}

/** Tapped a notification while the app was backgrounded (not killed). */
export function onNotificationOpenedApp(callback: (message: RemoteMessage) => void): () => void {
  try {
    return onMessagingNotificationOpenedApp(messaging(), callback);
  } catch (error) {
    console.log('[pushClient] onNotificationOpenedApp failed', error);
    return () => {};
  }
}

/** The notification that cold-started the app, if any. */
export async function getInitialNotification(): Promise<RemoteMessage | null> {
  try {
    return await getMessagingInitialNotification(messaging());
  } catch (error) {
    console.log('[pushClient] getInitialNotification failed', error);
    return null;
  }
}
