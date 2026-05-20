/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "380px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px"
    },
    extend: {
      colors: {
        cream: "#FBF7F0",
        bone: "#F1EBDF",
        ink: "#1F2421",
        forest: {
          DEFAULT: "#2C5545",
          light: "#3F7259",
          dark: "#1E3D31"
        },
        terracotta: {
          DEFAULT: "#D2603A",
          light: "#E8855E",
          soft: "#F4D5C5"
        },
        butter: "#F5E6B8",
        sky: "#CFE0E3"
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },
      borderRadius: {
        soft: "14px",
        pill: "999px"
      },
      boxShadow: {
        warm: "0 8px 24px -8px rgba(31, 36, 33, 0.12)",
        lift: "0 14px 40px -12px rgba(31, 36, 33, 0.18)"
      }
    }
  },
  plugins: []
};
