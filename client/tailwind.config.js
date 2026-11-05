/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#f43f5e',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          violet: '#7c3aed'
        }
      }
    },
  },
  plugins: [],
}
