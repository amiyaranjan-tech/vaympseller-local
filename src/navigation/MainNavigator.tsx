import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LayoutGrid, ShoppingBag, Store, Tag, Wallet } from 'lucide-react-native';

import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { ProductsScreen } from '../features/products/screens/ProductsScreen';
import { ShopScreen } from '../features/shop/screens/ShopScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { AddProductScreen } from '../features/products/screens/AddProductScreen';
import { ProductDetailsScreen } from '../features/products/screens/ProductDetailsScreen';
import { ComingSoonScreen } from '../components/common/ComingSoonScreen';
import { useThemeColors } from '../store/themeStore';
import {
  ROUTES,
  type MainStackParamList,
  type MainTabParamList,
} from './routeConfig';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Orders/Finance tab bodies and every push screen below except Settings
// are ComingSoonScreen instances — their backend contracts
// (/seller/orders, /seller/finance, ...) aren't confirmed yet (see each
// feature's *.api.ts stub). Swapped for a real screen one feature at a
// time as each contract lands. Products is fully wired to the real
// /seller/products API (see products.api.ts); Shop and Settings are real
// UI but still all-zero/local-only placeholder data pending their own
// contracts (see ShopScreen.tsx and SettingsScreen.tsx).
const OrdersTab = () => <ComingSoonScreen title="Orders" />;
const FinanceTab = () => <ComingSoonScreen title="Finance" />;

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
      <Tab.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} /> }}
      />
      <Tab.Screen
        name={ROUTES.PRODUCTS}
        component={ProductsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Tag color={color} size={size} /> }}
      />
      <Tab.Screen
        name={ROUTES.ORDERS}
        component={OrdersTab}
        options={{ tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} /> }}
      />
      <Tab.Screen
        name={ROUTES.FINANCE}
        component={FinanceTab}
        options={{ tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name={ROUTES.SHOP}
        component={ShopScreen}
        options={{ tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }}
      />
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
      <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
      <Stack.Screen name={ROUTES.ADD_PRODUCT} component={AddProductScreen} />
      <Stack.Screen name={ROUTES.PRODUCT_DETAILS} component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
}
