// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable support for SQLite `.db` files
config.resolver.assetExts.push('db');

// Enable support for `.mjs` files for Metro
config.resolver.sourceExts.push('mjs');

module.exports = config;