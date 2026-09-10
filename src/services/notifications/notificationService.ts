import { Platform } from 'react-native';

import { useAuthStore } from '../../store/useAuthStore';
import * as notificationsApi from '../../api/notifications.api';
import { queryClient } from '../../api/queryClient';
import { navigationRef } from '../../navigation/navigationRef';
import { ROUTES } from '../../navigation/routeConfig';
import {
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from './pushClient';
import { ensureNotificationPermission } from './notificationPermissions';
import {
  displayForegroundNotification,
  initLocalNotificationTapHandling,
} from './localNotifications';

/**
 * ==========================================
 * Notification Service
 * ==========================================
 *
 * Adapted from the Consumer app's own notificationService.ts for this
 * app's zustand + axios-interceptor auth (no authToken threading needed
 * here — src/api/client.ts's request() already attaches it to every call,
 * unlike Consumer's Redux-held token). Device-token registration, the
 * foreground push-display wiring, and tap handling. Most seller lifecycle
 * pushes still carry no entity data (sendSellerPush's `data` defaults to
 * `{}`), so most taps still just open the notifications inbox — but a
 * `new_order` push DOES carry `{orderId}` (see sellerNotification.service.js
 * #notifyNewOrder), so that one case deep-links straight to OrderDetail
 * instead, same shape the Consumer app's notificationNavigation.ts already
 * reads for its own OrderDetails deep link.
 */

// Firebase is only set up for Android right now (no iOS app registered in
// the Firebase console yet, same as the Consumer app) — everything push-
// related stays off on iOS rather than attempting calls against a
// provider that was never configured for this platform.
const IS_ANDROID = Platform.OS === 'android';

async function registerCurrentToken() {
  if (!IS_ANDROID) return;
  if (!useAuthStore.getState().isAuthenticated) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const deviceToken = await getToken();
  if (!deviceToken) return;

  try {
    await notificationsApi.registerDeviceToken({ token: deviceToken, platform: 'android', app: 'SELLER' });
  } catch (error) {
    console.log('[notificationService] registerDeviceToken failed', error);
  }
}

/** Called right before logout clears the auth token — see useAuthMutations.ts#useLogout. */
export async function unregisterCurrentDevice() {
  if (!useAuthStore.getState().isAuthenticated) return;

  try {
    const deviceToken = await getToken();
    if (deviceToken) await notificationsApi.unregisterDeviceToken(deviceToken);
  } catch (error) {
    console.log('[notificationService] unregisterCurrentDevice failed', error);
  }
}

// Cold-start tap resolves before NavigationContainer necessarily has —
// isReady() would otherwise silently drop it. Polls briefly rather than
// giving up.
function navigateOnceReady(navigate: () => void, attemptsLeft = 30) {
  if (navigationRef.isReady()) {
    navigate();
    return;
  }

  if (attemptsLeft <= 0) return;
  setTimeout(() => navigateOnceReady(navigate, attemptsLeft - 1), 100);
}

function handleMessageTap(data?: Record<string, string>) {
  void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] });
  void queryClient.invalidateQueries({ queryKey: ['seller-orders'] });

  if (data?.orderId) {
    navigateOnceReady(() =>
      navigationRef.navigate(ROUTES.MAIN, {
        screen: ROUTES.ORDER_DETAIL,
        params: { orderId: data.orderId },
      }),
    );
    return;
  }

  navigateOnceReady(() =>
    navigationRef.navigate(ROUTES.MAIN, {
      screen: ROUTES.NOTIFICATIONS,
    }),
  );
}

let started = false;

/** Called once from App.tsx, alongside the rest of app bootstrap. */
export function initNotifications() {
  if (started) return;
  started = true;

  // App.tsx calls this once on mount — at that exact instant the seller is
  // almost never logged in yet (zustand-persist rehydration still in
  // flight, see useAuthStore's own hasHydrated), so registerCurrentToken()
  // bails out immediately (see its own `if (!isAuthenticated) return`).
  // Without this subscription nothing ever retries it, so permission is
  // never actually requested and no device token ever gets registered for
  // a real seller. Firing on every logged-out -> logged-in transition (not
  // just once here) is what makes the permission prompt actually show up
  // right after login/registration.
  let wasAuthenticated = useAuthStore.getState().isAuthenticated;

  useAuthStore.subscribe(state => {
    if (state.isAuthenticated && !wasAuthenticated) {
      void registerCurrentToken();
    }
    wasAuthenticated = state.isAuthenticated;
  });

  void registerCurrentToken();

  if (!IS_ANDROID) return;

  onTokenRefresh(async newToken => {
    if (!useAuthStore.getState().isAuthenticated) return;

    try {
      await notificationsApi.registerDeviceToken({ token: newToken, platform: 'android', app: 'SELLER' });
    } catch (error) {
      console.log('[notificationService] token refresh registration failed', error);
    }
  });

  // Foreground — the OS never auto-displays a notification banner while
  // the app is in the foreground (standard FCM behavior, not a bug), so
  // without this the notification would silently do nothing visible at
  // all. Displayed as a real system notification (see localNotifications.ts)
  // rather than an in-app toast, so it looks and behaves the same as the
  // background case.
  //
  // Invalidated here (arrival), not just on tap (handleMessageTap) — a
  // seller already sitting in the app (e.g. on the Orders tab) needs the
  // tab badge/bell count to update the instant a push lands, not only
  // after they act on it. See useUnreadNewOrdersCount.ts, the Orders tab
  // badge's own query.
  onMessage(message => {
    void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] });

    const notification = message.notification;
    if (!notification) return;

    void displayForegroundNotification({
      title: notification.title ?? 'New notification',
      body: notification.body,
      data: message.data as Record<string, string> | undefined,
    });
  });

  initLocalNotificationTapHandling(data => handleMessageTap(data));

  onNotificationOpenedApp(message => handleMessageTap(message.data as Record<string, string> | undefined));

  void getInitialNotification().then(message => {
    if (message) handleMessageTap(message.data as Record<string, string> | undefined);
  });
}
