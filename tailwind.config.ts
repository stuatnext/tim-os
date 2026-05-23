import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F0F0E",
        paper: "#F8F6F1",
        accent: "#1D9E75",
        gold: "#B8960C",
        warn: "#BA7517",
        danger: "#B83232",
        line: "#E8E4D9",
        muted: "#7A766A",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        serif: ["ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(15,15,14,0.04), 0 1px 2px rgba(15,15,14,0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
