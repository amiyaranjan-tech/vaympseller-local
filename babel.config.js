module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // zod v4 ships `export * as core from ...` (ESM namespace re-export),
  // which the RN babel preset doesn't transform by default.
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    'react-native-worklets/plugin',
  ],
};
