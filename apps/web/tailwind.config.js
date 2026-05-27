/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17202a',
        slatepanel: '#f5f7fb',
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#0891b2',
          600: '#0e7490',
          700: '#155e75'
        }
      },
      boxShadow: {
        panel: '0 10px 30px rgba(21, 32, 43, 0.07)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
