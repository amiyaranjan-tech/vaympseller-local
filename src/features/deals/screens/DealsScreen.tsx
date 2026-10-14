import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { Screen } from '../../../components/layout/Screen';
import { AppHeader } from '../../../components/layout/AppHeader';
import { DealsManager } from '../DealsManager';

// Shop > Create Offer: every deal on the shop; new ones cover the whole shop.
// Product-specific deals are added from a product's own Deals tab.
export function DealsScreen() {
  const navigation = useNavigation();

  return (
    <Screen>
      <AppHeader title="Deals" onBack={() => navigation.goBack()} />
      <DealsManager />
    </Screen>
  );
}
