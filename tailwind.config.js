/** @type {import('tailwindcss').Config} */
module.exports = {
  // CRITICAL: Force 'class' mode to stop the darkMode crash in ThemeContext
  darkMode: 'class',
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
        primary: '#10B981',
        background: '#0A0A0A',
        surface: '#121212',
        border: '#27272A',
      },
    },
  },
  plugins: [],
};