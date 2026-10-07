import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Spacing } from '../../theme/spacing';

// Drop-in vertical ScrollView for screens with inputs — scrolls the focused
// field above the keyboard (same settings RegisterScreen uses), and lets
// taps on buttons/dropdowns land while the keyboard is open.
export function FormScrollView(props: React.ComponentProps<typeof KeyboardAwareScrollView>) {
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={Spacing.xxl}
      {...props}
    />
  );
}
