/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          600: '#d32f2f',
          700: '#c62828',
        },
      },
    },
  },
  plugins: [],
}