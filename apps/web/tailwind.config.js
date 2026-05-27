/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        slatepanel: '#f8fafc',
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#0891b2',
          600: '#0e7490',
          700: '#155e75'
        }
      },
      boxShadow: {
        panel: '0 18px 45px rgba(15, 23, 42, 0.10)',
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 14px 35px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
