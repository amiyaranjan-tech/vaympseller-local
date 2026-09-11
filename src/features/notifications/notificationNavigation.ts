import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ROUTES, type MainStackParamList } from '../../navigation/routeConfig';
import type { SellerNotification } from './notifications.api';

// Only `.navigate` is used here — narrowed to just that so a caller's
// navigation prop (typed against a specific current route, e.g.
// NativeStackNavigationProp<MainStackParamList, 'Notifications'>) is
// always assignable without a cast; the full prop type isn't structurally
// compatible across different route-name parameterizations.
type MainNav = Pick<NativeStackNavigationProp<MainStackParamList>, 'navigate'>;

/**
 * Where each notification type's row actually leads once tapped — an
 * explicit allow-list (same idea as the admin panel's own
 * notificationNavigation.ts) so a tap always lands on the one real screen
 * that type is about, not just the generic inbox it was tapped from.
 * product_rejected/product_approved carry a real productId (see the
 * backend's sellerNotification.service.js); everything else maps to
 * whichever tab/screen its name describes. Most of those aren't actually
 * triggered yet (see notifications.api.ts's own NOTIFICATION_TYPES list),
 * but should already point somewhere sensible the moment they are —
 * Returns/Offers are still "Coming Soon" placeholders in this app, so
 * order- and return-related types go to the real Orders screen instead of
 * a dead end.
 */
export function navigateFromNotification(item: SellerNotification, navigation: MainNav) {
  const productId =
    item.data && typeof item.data.productId === 'string' ? item.data.productId : undefined;

  switch (item.type) {
    case 'product_rejected':
    case 'product_approved':
    case 'low_stock':
    case 'out_of_stock':
      if (productId) {
        navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId });
      } else {
        navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.PRODUCTS });
      }
      return;
    case 'new_order':
    case 'order_cancelled':
    case 'return_request':
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.ORDERS });
      return;
    case 'refund_update':
    case 'payout_completed':
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.FINANCE });
      return;
    case 'offer_expiring':
      navigation.navigate(ROUTES.OFFERS);
      return;
    case 'verification_update':
    default:
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.SHOP });
      return;
  }
}
