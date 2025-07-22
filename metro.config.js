// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Enable support for `.db` files for expo-sqlite
config.resolver.assetExts.push('db');

// 2. Enable support for `mjs` and `wasm` files for Metro.
config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('wasm');

module.exports = config;