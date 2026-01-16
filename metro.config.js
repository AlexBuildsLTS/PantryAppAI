/**
 * @file metro.config.js
 * @description Metro Bundler configuration for NativeWind 4.
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Direct NativeWind to process global.css as the entry point
module.exports = withNativeWind(config, { 
  input: './global.css',
  inlineStyles: true 
});