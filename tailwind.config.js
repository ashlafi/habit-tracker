/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['YekanBakh', 'sans-serif'], // جایگزینی فونت پیش‌فرض سانز با یکان بخ
      },
    },
  },
  plugins: [],
}