import React from 'react';
import { ScrollView } from 'react-native';

// Vertical ScrollView for screens with inputs. Native keyboard handling
// only — react-native-keyboard-aware-scroll-view reads TextInput.State
// internals RN 0.86 removed ("cannot read property currentlyFocusedInput").
// Android: windowSoftInputMode="adjustResize" (AndroidManifest) shrinks the
// window and ScrollView keeps the focused field visible. iOS:
// automaticallyAdjustKeyboardInsets does the same. Taps on buttons/
// dropdowns land on the first press while the keyboard is open.
export function FormScrollView(props: React.ComponentProps<typeof ScrollView>) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
      {...props}
    />
  );
}
