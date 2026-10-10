import { NativeModules } from 'react-native';
import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
  EventType,
} from '@notifee/react-native';

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

// New orders: the backend sends new_order as a DATA-ONLY push, so the app
// itself draws the alert (displayNewOrderAlert) in every state —
// foreground, background and killed. The channel is SILENT: the sound
// (res/raw/new_order_sound.mp3) is looped by the native OrderAlarm module
// instead, because Android's own looping notification sound stops as soon
// as the shade is opened. Android fixes a channel's sound at creation, so
// older (sounding) channels are deleted via LEGACY_NEW_ORDER_CHANNEL_IDS.
const NEW_ORDER_CHANNEL_ID = 'new_order_alert_v3';
const LEGACY_NEW_ORDER_CHANNEL_IDS = ['new_order', 'new_order_alert', 'new_order_alert_v2'];

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
        // the CHANNEL's own sound (set in ensureChannels above) — this is
        // the pre-8 fallback, harmless but inert on modern devices.
        sound: SOUND_NAME,
      },
    });
  } catch (error) {
    console.log('[localNotifications] displayNotification failed', error);
  }
}

const OrderAlarm = NativeModules.OrderAlarm as { start(): void; stop(): void } | undefined;

// ONE alarm notification for every unhandled order (not one per order):
// it is also the foreground service that keeps the app alive while the
// sound loops (index.js#registerForegroundService). The waiting order ids
// live in its own `data.pending`, so the headless (background push) and UI
// JS contexts both read the same list.
const ALARM_NOTIFICATION_ID = 'new_order_alarm';

async function pendingOrderIds(): Promise<string[]> {
  const displayed = await notifee.getDisplayedNotifications();
  const alarm = displayed.find(n => n.id === ALARM_NOTIFICATION_ID);
  const pending = alarm?.notification.data?.pending;
  return typeof pending === 'string' && pending ? pending.split(',') : [];
}

async function showAlarm(pending: string[], data: Record<string, string>) {
  await ensureChannels();

  await notifee.displayNotification({
    id: ALARM_NOTIFICATION_ID,
    title: pending.length > 1 ? `${pending.length} new orders waiting` : data.title || 'New order',
    body: pending.length > 1 ? 'Open the app to accept them.' : data.body || 'Open the app to accept it.',
    data: { ...data, pending: pending.join(',') },
    android: {
      channelId: NEW_ORDER_CHANNEL_ID,
      smallIcon: 'ic_notification',
      color: '#4342FF',
      importance: AndroidImportance.HIGH,
      asForegroundService: true,
      foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK],
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      pressAction: { id: 'default', launchActivity: 'default' },
      // Opens the app's accept screen (IncomingOrderAlert) straight away
      // when the phone is locked/idle; a heads-up banner otherwise.
      fullScreenAction: { id: 'default', launchActivity: 'default' },
    },
  });
}

// The new-order alarm: rings (looping, through the shade being opened)
// until every waiting order is accepted/rejected — stopNewOrderAlert, from
// the app or via the backend's "new_order_handled" push.
export async function displayNewOrderAlert(data: Record<string, string>) {
  try {
    const pending = await pendingOrderIds();
    if (!pending.includes(data.orderId)) pending.push(data.orderId);
    await showAlarm(pending, data);
  } catch (error) {
    console.log('[localNotifications] displayNewOrderAlert failed', error);
  }
}

/** Foreground-service runner body — see index.js. */
export function startOrderAlarmSound() {
  OrderAlarm?.start();
}

export async function stopAllNewOrderAlerts() {
  OrderAlarm?.stop();
  await notifee.stopForegroundService().catch(() => undefined);
  await notifee.cancelNotification(ALARM_NOTIFICATION_ID).catch(() => undefined);
}

export async function stopNewOrderAlert(orderId: string) {
  try {
    const pending = await pendingOrderIds();
    if (!pending.includes(orderId)) return;

    const rest = pending.filter(id => id !== orderId);
    if (rest.length === 0) {
      await stopAllNewOrderAlerts();
      return;
    }

    const displayed = await notifee.getDisplayedNotifications();
    const data = displayed.find(n => n.id === ALARM_NOTIFICATION_ID)?.notification.data ?? {};
    await showAlarm(rest, { ...(data as Record<string, string>), orderId: rest[rest.length - 1] });
  } catch (error) {
    console.log('[localNotifications] stopNewOrderAlert failed', error);
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
    void stopNewOrderAlert(data.orderId);
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
