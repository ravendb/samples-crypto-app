const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  purge: ["./src/**/*.html", "./src/**/*.{js,jsx,ts,tsx,vue}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {},
    container: {
      padding: "1rem",
    },
    fontFamily: {
      sans: ["Source Sans Pro", "Arial", "Helvetica", "sans-serif"],
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      gray: colors.trueGray,
      red: colors.red,
      blue: colors.sky,
      yellow: colors.amber,
      white: colors.white,
      green: colors.green,
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
