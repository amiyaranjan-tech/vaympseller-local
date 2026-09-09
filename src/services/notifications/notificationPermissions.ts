import { checkNotifications, requestNotifications, RESULTS } from 'react-native-permissions';

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
