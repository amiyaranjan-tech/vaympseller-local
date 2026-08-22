import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { ComingSoonScreen } from '../components/common/ComingSoonScreen';
import { useThemeColors } from '../store/themeStore';
import {
  ROUTES,
  type MainStackParamList,
  type MainTabParamList,
} from './routeConfig';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Products/Orders/Finance/Shop tab bodies and every push screen below are
// ComingSoonScreen instances — their backend contracts
// (/seller/products, /seller/orders, /seller/finance, /seller/shop, ...)
// aren't confirmed yet (see each feature's *.api.ts stub). Swapped for a
// real screen one feature at a time as each contract lands.
const ProductsTab = () => <ComingSoonScreen title="Products" />;
const OrdersTab = () => <ComingSoonScreen title="Orders" />;
const FinanceTab = () => <ComingSoonScreen title="Finance" />;
const ShopTab = () => <ComingSoonScreen title="Shop" />;

function MainTabs() {
  const { colors } = useThemeColors();

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.DASHBOARD}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navIconActive,
        tabBarInactiveTintColor: colors.navIconInactive,
        tabBarStyle: { backgroundColor: colors.navBackground, borderTopColor: colors.navBorder },
      }}
    >
      <Tab.Screen name={ROUTES.DASHBOARD} component={DashboardScreen} />
      <Tab.Screen name={ROUTES.PRODUCTS} component={ProductsTab} />
      <Tab.Screen name={ROUTES.ORDERS} component={OrdersTab} />
      <Tab.Screen name={ROUTES.FINANCE} component={FinanceTab} />
      <Tab.Screen name={ROUTES.SHOP} component={ShopTab} />
    </Tab.Navigator>
  );
}

type PushProps = NativeStackScreenProps<MainStackParamList, keyof MainStackParamList>;
const withBack = (title: string) =>
  function PushedComingSoon({ navigation }: PushProps) {
    return <ComingSoonScreen title={title} onBack={() => navigation.goBack()} />;
  };

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.MAIN_TABS} component={MainTabs} />
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={withBack('Notifications')} />
      <Stack.Screen name={ROUTES.RETURNS} component={withBack('Returns')} />
      <Stack.Screen name={ROUTES.OFFERS} component={withBack('Offers')} />
      <Stack.Screen name={ROUTES.INVENTORY} component={withBack('Inventory')} />
      <Stack.Screen name={ROUTES.SUPPORT} component={withBack('Support')} />
      <Stack.Screen name={ROUTES.SETTINGS} component={withBack('Settings')} />
    </Stack.Navigator>
  );
}
