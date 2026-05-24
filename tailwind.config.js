/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',  // FIX: was missing, causing purged styles in prod build
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d8eaff',
          200: '#b9d8ff',
          300: '#88bdff',
          400: '#5098fc',
          500: '#2a75f3',
          600: '#1a56db',
          700: '#163faf',
          800: '#17368e',
          900: '#182f73',
        }
      }
    },
  },
  plugins: [],
}
