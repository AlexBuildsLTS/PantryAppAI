/** @type {import('tailwindcss').Config} */
module.exports = {
  // Added all subdirectories to ensure no class is ever "missed"
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
    './global.css',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Your design palette
        primary: '#64FFDA',
        background: '#0A0A0A',
        border: '#27272A',
      },
    },
  },
  plugins: [],
};
