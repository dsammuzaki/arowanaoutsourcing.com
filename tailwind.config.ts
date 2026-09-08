import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PT Arowana Bintang Perdana — teal + gold (from the logo)
        // deep teal-ink used for the dark sidebar / hero surfaces
        navy: {
          DEFAULT: "#0a2029",
          800: "#0f2c38",
          700: "#153a49",
          600: "#1c4b5d",
        },
        teal: {
          DEFAULT: "#1a7d9c", // logo petrol-blue
          dark: "#146078",
          deep: "#0e4658",
          soft: "#d3e9f0",
        },
        gold: {
          DEFAULT: "#c69a34", // logo gold
          light: "#e6c46e",
          dark: "#a9772a",
          soft: "#f4e8cb",
        },
        brand: {
          // kept for semantic "danger/negative" (deductions, overdue, down)
          red: "#c0392b",
          reddark: "#a5341f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(10,32,41,0.06), 0 1px 2px rgba(10,32,41,0.04)",
        soft: "0 4px 24px rgba(10,32,41,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
