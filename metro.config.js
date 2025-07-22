const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(__dirname);

// Add 'wasm' to assetExts and sourceExts
config.resolver.assetExts.push('wasm');

// Add extraNodeModules alias for wa-sqlite
config.resolver.extraNodeModules = {
  'wa-sqlite': path.resolve(projectRoot, 'node_modules', 'wa-sqlite', 'dist'),
};

// Custom resolver for wa-sqlite.wasm
// This is crucial for expo-sqlite's web support
const expoSqlitePath = path.resolve(projectRoot, 'node_modules', 'expo-sqlite');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === './wa-sqlite/wa-sqlite.wasm') {
    // Construct the path to wa-sqlite.wasm relative to the expo-sqlite package root
    // It's typically found in the 'dist' folder within the expo-sqlite package
    const wasmFilePath = path.resolve(expoSqlitePath, 'dist', 'wa-sqlite', 'wa-sqlite.wasm');
    return {
      type: 'asset',
      filePath: wasmFilePath,
    };
  }
  // Fallback to the default resolver for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;