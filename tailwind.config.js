/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brick: {
          50: '#fff4ed',
          100: '#ffe3d0',
          200: '#ffc7a1',
          300: '#ffa168',
          400: '#ff7a3d',
          500: '#f2560f',
          600: '#d6410a',
          700: '#a8320c',
          800: '#7c260e',
        },
        gold: {
          400: '#f4b73f',
          500: '#e8a324',
        },
        cream: '#fff8ee',
      },
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        heading: ['Poppins', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 30px -10px rgba(214, 65, 10, 0.45)',
      },
    },
  },
  plugins: [],
}

