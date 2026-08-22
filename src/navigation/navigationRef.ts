import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './routeConfig';

// Lets plain (non-component) modules — api/client.ts's 401 handling — reset
// navigation without needing a component's own useNavigation(). Attached to
// <NavigationContainer ref={navigationRef}> in AppNavigator.tsx; `isReady()`
// guards the brief window before that container has mounted.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToAuth() {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'Login' } }],
    });
  }
}
