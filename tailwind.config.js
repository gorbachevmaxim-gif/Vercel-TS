/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nohemi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        komoot: {
          green: '#93bf33',
          dark: '#333333',
          gray: '#f5f5f5',
          light: '#fbfbf9', // Warm off-white background
          hover: '#7fa82b',
        }
      },
      boxShadow: {
        'komoot': '0 2px 8px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}