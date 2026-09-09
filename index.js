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

  setBackgroundMessageHandler(getMessaging(), async () => {
    // No-op — the OS already displays the notification from its own
    // `notification` payload; this only needs to exist so the app doesn't
    // warn about a missing handler. Foreground handling is wired in
    // src/services/notifications/notificationService.ts.
  });
} catch (error) {
  console.log('[index] Firebase background handler registration failed', error);
}

AppRegistry.registerComponent(appName, () => App);
