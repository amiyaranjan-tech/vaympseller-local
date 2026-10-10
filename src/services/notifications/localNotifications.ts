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

// New orders get their own channel + sound (res/raw/new_order_sound.mp3).
// The backend sends new_order as a DATA-ONLY push, so the app itself draws
// it (displayNewOrderAlert) in every state — foreground, background and
// killed. A fresh channel id: Android fixes a channel's sound at creation,
// and older channels were created with previous sounds — bump the id on
// every sound change and add the old one to LEGACY_NEW_ORDER_CHANNEL_IDS.
const NEW_ORDER_CHANNEL_ID = 'new_order_alert_v2';
const LEGACY_NEW_ORDER_CHANNEL_IDS = ['new_order', 'new_order_alert'];
const NEW_ORDER_SOUND_NAME = 'new_order_sound';

let channelsReady: Promise<void> | null = null;

// Android only ever honors a channel's sound as set at CREATION time —
// changing it later requires deleting and recreating the channel, which
// would drop the user's own notification settings for it. Also called at
// startup (notificationService.ts#initNotifications): a background push
// naming a channel that doesn't exist yet falls back to FCM's default one.
export function ensureChannels(): Promise<void> {
  if (!channelsReady) {
    channelsReady = Promise.all([
      notifee.createChannel({
        id: CHANNEL_ID,
        name: 'General',
        importance: AndroidImportance.HIGH,
        sound: SOUND_NAME,
      }),
      notifee.createChannel({
        id: NEW_ORDER_CHANNEL_ID,
        name: 'New Orders',
        importance: AndroidImportance.HIGH,
        sound: NEW_ORDER_SOUND_NAME,
        vibration: true,
      }),
      ...LEGACY_NEW_ORDER_CHANNEL_IDS.map(id => notifee.deleteChannel(id)),
    ])
      .then(() => undefined)
      .catch(error => {
        console.log('[localNotifications] createChannel failed', error);
      });
  }

  return channelsReady;
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
    await ensureChannels();

    const isNewOrder = data?.type === 'new_order';
    const channelId = isNewOrder ? NEW_ORDER_CHANNEL_ID : CHANNEL_ID;
    const sound = isNewOrder ? NEW_ORDER_SOUND_NAME : SOUND_NAME;

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        color: '#4342FF',
        pressAction: { id: 'default' },
        // Android 8+ (the vast majority of real devices) only ever plays
        // the CHANNEL's own sound (set in ensureChannels above) — this is
        // the pre-8 fallback, harmless but inert on modern devices.
        sound,
      },
    });
  } catch (error) {
    console.log('[localNotifications] displayNotification failed', error);
  }
}

const newOrderAlertId = (orderId: string) => `new_order_${orderId}`;

// The new-order alert: its sound LOOPS (Android's insistent flag) until
// the seller has SEEN it — Android stops the loop once they pull down the
// notification shade, tapping/swiping removes it, and opening the app
// clears it (stopAllNewOrderAlerts, notificationService.ts). Accepting/
// rejecting (here or on another device, via the backend's
// "new_order_handled" push) also clears it.
export async function displayNewOrderAlert(data: Record<string, string>) {
  try {
    await ensureChannels();

    await notifee.displayNotification({
      id: newOrderAlertId(data.orderId),
      title: data.title || 'New order',
      body: data.body,
      data,
      android: {
        channelId: NEW_ORDER_CHANNEL_ID,
        smallIcon: 'ic_notification',
        color: '#4342FF',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default', launchActivity: 'default' },
        sound: NEW_ORDER_SOUND_NAME,
        loopSound: true,
        autoCancel: true,
      },
    });
  } catch (error) {
    console.log('[localNotifications] displayNewOrderAlert failed', error);
  }
}

export function stopNewOrderAlert(orderId: string) {
  notifee.cancelNotification(newOrderAlertId(orderId)).catch(() => undefined);
}

/** The seller opened the app — every pending new-order alert counts as seen. */
export async function stopAllNewOrderAlerts() {
  try {
    const displayed = await notifee.getDisplayedNotifications();
    await Promise.all(
      displayed
        .filter(n => n.id?.startsWith(newOrderAlertId('')))
        .map(n => notifee.cancelNotification(n.id!)),
    );
  } catch (error) {
    console.log('[localNotifications] stopAllNewOrderAlerts failed', error);
  }
}

// Data-only pushes (new_order / new_order_handled) — the same handling for
// the foreground (notificationService.ts) and background/killed (index.js)
// cases. Returns whether the message was one of these.
export function handleOrderAlertData(data?: Record<string, string>): boolean {
  if (!data?.orderId) return false;

  if (data.type === 'new_order') {
    void displayNewOrderAlert(data);
    return true;
  }

  if (data.type === 'new_order_handled') {
    stopNewOrderAlert(data.orderId);
    return true;
  }

  return false;
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
