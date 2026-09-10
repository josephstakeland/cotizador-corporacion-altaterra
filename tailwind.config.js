/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0f2744",
          gold: "#d4b36a",
          green: "#1f6b3a",
          cream: "#f7f4ee",
          night: "#0b1220",
          panel: "#141c2c",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
