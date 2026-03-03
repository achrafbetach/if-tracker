/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e17',
          800: '#0d1520',
          700: '#111827',
          600: '#1e2d40',
          500: '#2d4060',
        },
        cyan: {
          DEFAULT: '#00d4ff',
          dark: '#0099bb',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
