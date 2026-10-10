/**
 * @format
 */

import './src/theme/applyGlobalFont';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Must be registered here, top-level, before AppRegistry — Android's
// headless JS task looks for this at the module's top level, not inside a
// component effect (too late: the JS context may not even be running a
// React tree when a background/killed-state push arrives). Wrapped so a
// native-module hiccup here can never crash app launch (see
// src/services/notifications/pushClient.ts's own "never throws" rule).
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');

  setBackgroundMessageHandler(getMessaging(), async message => {
    // Regular pushes are displayed by the OS from their `notification`
    // payload. The new-order alert is data-only, so it's drawn here (looping
    // sound until the order is handled) — see localNotifications.ts.
    const { handleOrderAlertData } = require('./src/services/notifications/localNotifications');
    handleOrderAlertData(message.data);
  });

  // The new-order alarm's foreground service: loops the order sound until
  // every waiting order is handled — stopAllNewOrderAlerts() ends it. The
  // promise deliberately never resolves (resolving stops the service).
  require('@notifee/react-native').default.registerForegroundService(
    () =>
      new Promise(() => {
        require('./src/services/notifications/localNotifications').startOrderAlarmSound();
      }),
  );

  // Tapping a Notifee-drawn notification (the new-order alert) while the
  // app is in the background — open that order.
  const notifee = require('@notifee/react-native').default;
  const { EventType } = require('@notifee/react-native');
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      const { handleMessageTap } = require('./src/services/notifications/notificationService');
      handleMessageTap(detail.notification?.data);
    }
  });
} catch (error) {
  console.log('[index] Firebase background handler registration failed', error);
}

AppRegistry.registerComponent(appName, () => App);
