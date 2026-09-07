/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff9ff",
          100: "#d9f1ff",
          200: "#b9e5ff",
          300: "#86d5ff",
          400: "#4abfff",
          500: "#199fe9",
          600: "#087fc5",
          700: "#0968a3",
          800: "#0b5585",
          900: "#0c456d",
          950: "#082d49",
        },
        gold: {
          400: "#f2ce83",
          500: "#d8a64a",
          600: "#ad7930",
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
