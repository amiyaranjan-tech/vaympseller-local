import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

/**
 * ==========================================
 * Local Notifications (Notifee)
 * ==========================================
 *
 * Adapted from the Consumer app's own localNotifications.ts. Firebase's
 * onMessage only hands the app the message data while it's in the
 * foreground — Android never auto-displays a system notification for that
 * case (background/killed-state pushes already show one natively, no
 * library needed there — see pushClient.ts's onNotificationOpenedApp).
 * This is purely to cover the foreground gap with a REAL notification
 * instead of an in-app toast, using the same icon/color already set up in
 * AndroidManifest.xml for the background case.
 *
 * Most seller lifecycle notifications (verified/suspended/registered/...)
 * still carry no entity data to route on (sendSellerPush's `data` defaults
 * to `{}`), so most taps still just surface the Shop tab's own
 * notifications list. new_order is the one type that now does carry data
 * (`{orderId}` — see sellerNotification.service.js#notifyNewOrder) — data
 * is threaded through here (Notifee's own `data` field) so
 * notificationService.ts#handleMessageTap can deep-link that one case.
 */

const CHANNEL_ID = 'default';

// android/app/src/main/res/raw/notification_sound.wav — same file the
// Consumer app's Android notification channel/FCM payload both reference
// (see the backend's services/notification/firebaseProvider.js).
const SOUND_NAME = 'notification_sound';

let channelReady: Promise<void> | null = null;

// Android only ever honors a channel's sound as set at CREATION time —
// changing it later requires deleting and recreating the channel, which
// would drop the user's own notification settings for it.
function ensureChannel(): Promise<void> {
  if (!channelReady) {
    channelReady = notifee
      .createChannel({
        id: CHANNEL_ID,
        name: 'General',
        importance: AndroidImportance.HIGH,
        sound: SOUND_NAME,
      })
      .then(() => undefined)
      .catch(error => {
        console.log('[localNotifications] createChannel failed', error);
      });
  }

  return channelReady;
}

export async function displayForegroundNotification({
  title,
  body,
  data,
}: {
  title: string;
  body?: string;
  data?: Record<string, string>;
}) {
  try {
    await ensureChannel();

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_notification',
        color: '#4342FF',
        pressAction: { id: 'default' },
        // Android 8+ (the vast majority of real devices) only ever plays
        // the CHANNEL's own sound (set in ensureChannel above) — this is
        // the pre-8 fallback, harmless but inert on modern devices.
        sound: SOUND_NAME,
      },
    });
  } catch (error) {
    console.log('[localNotifications] displayNotification failed', error);
  }
}

/** Tapping a locally-displayed (foreground) notification. */
export function initLocalNotificationTapHandling(
  onTap: (data?: Record<string, string>) => void,
) {
  try {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) onTap(detail.notification?.data as Record<string, string> | undefined);
    });
  } catch (error) {
    console.log('[localNotifications] onForegroundEvent wiring failed', error);
  }
}
