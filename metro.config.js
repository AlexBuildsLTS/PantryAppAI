const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, {
  // Matches the output path in the build command above
  input: './global.css',
  projectRoot: __dirname,
  inlineStyles: true,
});
