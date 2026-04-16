/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tpq: {
          green: '#1a4325', // dark green base
          light: '#2e6b3c', // lighter green
          yellow: '#f8c700', // primary CTA
          darkyellow: '#d9a900', // active yellow
          gray: '#f5f5f5', // off white background
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
