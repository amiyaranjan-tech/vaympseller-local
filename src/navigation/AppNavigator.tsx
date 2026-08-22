import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { AccountStatusScreen } from '../features/auth/screens/AccountStatusScreen';
import { navigationRef } from './navigationRef';
import { ROUTES, type RootStackParamList } from './routeConfig';
import { useAuthStore } from '../store/useAuthStore';
import { useSellerAccess } from '../hooks/useSellerAccess';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Three-way root switch: unauthenticated -> Auth stack, authenticated but
// blocked (pending/suspended/rejected/inactive status) -> AccountStatus,
// authenticated and active -> Main stack. Gated on status alone, not
// verification — an active-but-unverified seller still reaches Main;
// verified-only actions (adding a product, ...) are gated individually
// via useSellerAccess().isActive instead of blocking the whole app. Driven
// purely by persisted Zustand state, so a 401 clearing that state (see
// api/client.ts) flips this back to Auth on its own — no imperative
// navigation needed for that case, resetToAuth() in navigationRef.ts is
// just belt-and-suspenders for any stale nested-stack state.
export function AppNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { isAccountActive } = useSellerAccess();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name={ROUTES.AUTH} component={AuthNavigator} />
        ) : !isAccountActive ? (
          <Stack.Screen name={ROUTES.ACCOUNT_STATUS} component={AccountStatusScreen} />
        ) : (
          <Stack.Screen name={ROUTES.MAIN} component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
