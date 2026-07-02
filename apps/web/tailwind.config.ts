import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        k7: {
          orange: "#F97316",
          orangeDark: "#EA580C",
          ink: "#1A1A1A",
          soft: "#F3F4F6",
          line: "#E5E7EB",
          muted: "#9CA3AF"
        }
      },
      boxShadow: {
        card: "0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
