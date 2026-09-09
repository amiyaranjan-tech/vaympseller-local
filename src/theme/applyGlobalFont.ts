import * as React from 'react';
import { StyleSheet } from 'react-native';

// react-native's named exports (Text, TextInput, ...) are getter-only
// accessors on its module.exports object. Redefining them here patches that
// same object that every `import { Text } from 'react-native'` reads from —
// Babel compiles named imports to a live property access, not a one-time
// destructure, so this takes effect everywhere without touching each screen.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native');

const REGULAR_FONT = 'Sansation-Regular';
const BOLD_FONT = 'Sansation-Bold';

function fontFamilyFor(style: unknown): string {
  const flat = StyleSheet.flatten(style as never) as
    | { fontWeight?: string | number }
    | undefined;
  const weight = flat?.fontWeight != null ? String(flat.fontWeight) : '';
  return weight === 'bold' || Number(weight) >= 600 ? BOLD_FONT : REGULAR_FONT;
}

const OriginalText = RN.Text;
const OriginalTextInput = RN.TextInput;

const FontText = React.forwardRef((props: any, ref: any) =>
  React.createElement(OriginalText, {
    ...props,
    ref,
    style: [{ fontFamily: fontFamilyFor(props.style) }, props.style],
  }),
);

const FontTextInput = React.forwardRef((props: any, ref: any) =>
  React.createElement(OriginalTextInput, {
    ...props,
    ref,
    style: [{ fontFamily: REGULAR_FONT }, props.style],
  }),
);

Object.defineProperty(RN, 'Text', { value: FontText, configurable: true, enumerable: true });
Object.defineProperty(RN, 'TextInput', {
  value: FontTextInput,
  configurable: true,
  enumerable: true,
});
