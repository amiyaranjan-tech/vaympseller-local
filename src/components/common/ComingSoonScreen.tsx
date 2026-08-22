import React from 'react';

import { Screen } from '../layout/Screen';
import { AppHeader } from '../layout/AppHeader';
import { EmptyState } from '../feedback/EmptyState';

interface ComingSoonScreenProps {
  title: string;
  onBack?: () => void;
}

// One placeholder for every feature area whose backend contract isn't
// confirmed yet (Products/Orders/Finance/... — see feature *.api.ts stubs).
// Swapped out screen-by-screen for the real thing as each contract lands,
// no per-feature placeholder component needed until then.
export function ComingSoonScreen({ title, onBack }: ComingSoonScreenProps) {
  return (
    <Screen>
      <AppHeader title={title} onBack={onBack} />
      <EmptyState
        title="Coming soon"
        subtitle={`${title} is being built on the backend right now — check back shortly.`}
      />
    </Screen>
  );
}
