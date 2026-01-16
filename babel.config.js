/**
 * @file babel.config.js
 * @description Core Babel configuration for Pantry Pal.
 * FIXES: 500 Internal Server Error and MIME type mismatch.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind 4 relies on the jsxImportSource directive instead of a separate preset
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }]
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};