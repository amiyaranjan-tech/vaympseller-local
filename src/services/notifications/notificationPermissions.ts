import { Alert, NativeModules } from 'react-native';
import { checkNotifications, requestNotifications, RESULTS } from 'react-native-permissions';

const OrderAlarm = NativeModules.OrderAlarm as
  | { canUseFullScreenIntent(): Promise<boolean>; openFullScreenIntentSettings(): void }
  | undefined;

/**
 * Android 14+: without "Full screen notifications" allowed, the new-order
 * popup only shows as a banner while the app is closed — so ask, every
 * launch, until it's on.
 */
export async function ensureFullScreenAlertPermission() {
  try {
    if (!OrderAlarm?.canUseFullScreenIntent || (await OrderAlarm.canUseFullScreenIntent())) return;

    Alert.alert(
      'Allow new-order pop-ups',
      'To see new orders full screen even when the app is closed or the phone is locked, turn on "Full screen notifications" for Vaymp Seller.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => OrderAlarm.openFullScreenIntentSettings() },
      ],
    );
  } catch (error) {
    console.log('[notificationPermissions] full-screen check failed', error);
  }
}

/**
 * ==========================================
 * Notification Permission
 * ==========================================
 *
 * Ported verbatim from the Consumer app. NOT pushClient's requestPermission()
 * — @react-native-firebase/messaging's version is a hard no-op on Android
 * (it just resolves AUTHORIZED immediately without ever touching the OS,
 * messaging is iOS-only there, deprecated in favor of this exact library
 * for Android). react-native-permissions' requestNotifications() is the
 * real cross-platform call: it triggers Android 13+'s system
 * POST_NOTIFICATIONS dialog and iOS's standard push authorization prompt.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await checkNotifications();

    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true;
    }

    const requested = await requestNotifications(['alert', 'badge', 'sound']);

    return requested.status === RESULTS.GRANTED || requested.status === RESULTS.LIMITED;
  } catch (error) {
    console.log('[notificationPermissions] request failed', error);
    return false;
  }
}
