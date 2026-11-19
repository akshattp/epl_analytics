/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: "#101828",
          deepInk: "#172554",
          blue: "#3B82F6",
          blueDark: "#2563EB",
          blueLight: "#60A5FA",
          cyan: "#22D3EE",
          cyanDark: "#0891B2",
          slate: "#64748B",
          slateLight: "#94A3B8",
          softBlue: "#DBEAFE",
          paleCyan: "#CFFAFE",
          lightBg: "#F8FAFC",
          lightSurface: "#FFFFFF",
          darkBg: "#0B1120",
          darkSurface: "#151F32",
          darkElevated: "#1E293B",
          borderLight: "#E2E8F0",
          borderDark: "#334155",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
