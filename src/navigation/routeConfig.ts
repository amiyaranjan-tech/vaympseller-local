import type { NavigatorScreenParams } from '@react-navigation/native';

// Central route-name list — a rename only touches this file. Grouped by
// which navigator owns each screen.
export const ROUTES = {
  // Auth stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',

  // Root
  AUTH: 'Auth',
  ACCOUNT_STATUS: 'AccountStatus',
  MAIN: 'Main',

  // Main stack (tabs screen + push-only screens reachable from Shop/profile)
  MAIN_TABS: 'MainTabs',
  NOTIFICATIONS: 'Notifications',
  RETURNS: 'Returns',
  OFFERS: 'Offers',
  INVENTORY: 'Inventory',
  SUPPORT: 'Support',
  SETTINGS: 'Settings',
  ADD_PRODUCT: 'AddProduct',
  PRODUCT_DETAILS: 'ProductDetails',
  SHOP_DETAILS: 'ShopDetails',
  ORDER_ACTIVITY: 'OrderActivity',

  // Bottom tabs
  DASHBOARD: 'Dashboard',
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  FINANCE: 'Finance',
  SHOP: 'Shop',
} as const;

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  // `token` is optional — a real deep link would carry it, but deep linking
  // isn't wired up yet (out of scope for this pass), so the screen also
  // lets the seller paste the token from their reset email manually.
  ResetPassword: { token?: string } | undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Finance: undefined;
  Shop: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Notifications: undefined;
  Returns: undefined;
  Offers: undefined;
  Inventory: undefined;
  Support: undefined;
  Settings: undefined;
  AddProduct: undefined;
  ProductDetails: { productId: string; tab?: 'details' | 'deals' };
  ShopDetails: { openBranding?: boolean } | undefined;
  OrderActivity: undefined;
};

// Root switch: unauthenticated -> Auth, authenticated but blocked (pending/
// suspended/rejected/inactive — see useSellerAccess) -> AccountStatus,
// authenticated and active -> Main. See AppNavigator.tsx.
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  AccountStatus: undefined;
  Main: NavigatorScreenParams<MainStackParamList>;
};
