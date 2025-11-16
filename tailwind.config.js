/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2D2A5A",        // Deep Indigo
        accent1: "#33D4C6",        // Aqua Blue
        accent2: "#FF6F5E",        // Warm Coral
        background: "#F8F8F2",     // Soft Ivory
        textSecondary: "#4A4A4A",  // Slate Gray
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 16px rgba(0, 0, 0, 0.08)",
        glass: "0 8px 32px rgba(45, 42, 90, 0.12)",
      },
      backgroundImage: {
        "chrono-gradient": "linear-gradient(135deg, #33D4C6, #2D2A5A)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
