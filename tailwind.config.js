/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brick: {
          50: '#fdf3ee',
          100: '#fbe4d8',
          500: '#c65d2e',
          600: '#a84a22',
          700: '#8a3a1b',
        },
        cream: '#fffaf3',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

