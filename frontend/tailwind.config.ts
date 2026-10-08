import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF385C",
          dark: "#E31C5F",
        },
        airbnb: {
          text: "#222222",
          muted: "#717171",
          border: "#DDDDDD",
          surface: "#F7F7F7",
        },
      },
      boxShadow: {
        search: "0 2px 4px rgba(0,0,0,.18)",
        dropdown: "0 6px 16px rgba(0,0,0,.12)",
      },
      maxWidth: {
        container: "1760px",
      },
      borderRadius: {
        card: "0.75rem", // rounded-xl
      },
    },
  },
  plugins: [],
};

export default config;
