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
        // PT Arowana Bintang Perdana brand palette (extracted from company profile)
        navy: {
          DEFAULT: "#0c1320",
          800: "#141d2e",
          700: "#1c2740",
          600: "#20324a",
        },
        teal: {
          DEFAULT: "#1d9ca3",
          dark: "#217c7c",
          deep: "#155e63",
          soft: "#c4e9dd",
        },
        brand: {
          red: "#da1315",
          reddark: "#bd1b20",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(12,19,32,0.06), 0 1px 2px rgba(12,19,32,0.04)",
        soft: "0 4px 24px rgba(12,19,32,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
