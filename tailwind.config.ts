import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        foreground: "#f3f4f6",
        card: "#111827",
        "card-foreground": "#f3f4f6",
        border: "#374151", // gray-700
        accent: {
          DEFAULT: "#8a2be2", // blue-violet
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
export default config;

