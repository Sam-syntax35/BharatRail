/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7ccbfd',
          400: '#38b0f8',
          500: '#0ea0ea',
          600: '#0280c7',
          700: '#0366a1',
          800: '#075685',
          900: '#0c476e',
          950: '#082f49', // Rich Deep Blue
        },
        secondary: {
          50: '#f0f5ff',
          100: '#e0eafd',
          200: '#c1d5fa',
          300: '#93b5f6',
          400: '#5c8df1',
          500: '#3b82f6', // Royal Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          950: '#0f172a',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdbb74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c', // Orange
          700: '#c2410c',
          850: '#9a3412',
          950: '#431407',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
        'premium-lg': '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
