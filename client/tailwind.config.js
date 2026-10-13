/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f3f5ef",
          100: "#e5eadf",
          200: "#ccd7c4",
          300: "#aabb9f",
          400: "#8ca27f",
          500: "#6b8560",
          600: "#506c48",
          700: "#3e5738",
          800: "#33472e",
          900: "#2b3c28",
          950: "#1d2e25",
        },
        gold: {
          400: "#e9d7af",
          500: "#d8be89",
          600: "#b39660",
        }
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
}
