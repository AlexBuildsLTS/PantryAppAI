// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Enable support for SQLite databases and WebAssembly modules.
config.resolver.assetExts.push('db', 'wasm');

// 2. Enable support for `mjs` files for Metro.
config.resolver.sourceExts.push('mjs');

module.exports = config;
