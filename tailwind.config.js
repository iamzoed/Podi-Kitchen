/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "brick" keeps its token name (used everywhere as bg-brick-600 etc.)
        // but now carries the States&Swaad brand green from the logo/poster,
        // rather than the old red. Renaming the token itself would mean
        // touching every className across the app for zero visual gain —
        // swapping the values under the same name recolors everywhere at
        // once, safely.
        brick: {
          50: '#f0f7f4',
          100: '#d9ede4',
          200: '#b3dbc9',
          300: '#7dbfa3',
          400: '#4a9b7d',
          500: '#2f7a5e',
          600: '#245c45',
          700: '#1b4636',
          800: '#122e23',
        },
        gold: {
          400: '#f6c453',
          500: '#e8791f',
        },
        cream: '#fff8ee',
      },
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        heading: ['Poppins', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 30px -10px rgba(36, 92, 69, 0.45)',
      },
    },
  },
  plugins: [],
}

