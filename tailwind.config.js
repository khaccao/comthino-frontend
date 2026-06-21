/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quecan: {
          cream: '#FFF4DD',
          golden: '#D99A2B',
          orange: '#C96A24',
          brown: '#4A250F',
          dark: '#2B1608',
          beige: '#F7E4C6',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(74, 37, 15, 0.12)',
        'warm-lg': '0 10px 30px -5px rgba(74, 37, 15, 0.2)',
      }
    },
  },
  plugins: [],
}
