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
        // Core Luxury Palette: Obsidian, Warm Ivory, Electric Vermilion
        obsidian: {
          DEFAULT: "#111318",
          card: "#181A20",
          elevated: "#22252D",
          border: "#2A2E38",
          deep: "#0D0E12",
        },
        ivory: {
          DEFAULT: "#F1EBDD",
          card: "#FAF7F0",
          surface: "#FFFFFF",
          muted: "#E8E1D1",
          border: "#DDD5C3",
          deep: "#C8BEAA",
        },
        vermilion: {
          DEFAULT: "#FF4B35",
          hover: "#E03E29",
          bright: "#FF6452",
          soft: "rgba(255, 75, 53, 0.12)",
          glow: "rgba(255, 75, 53, 0.28)",
        },
        brand: {
          // Luxury Re-mapped Palette
          midnight: "#111318",
          deepInk: "#181A20",
          blue: "#FF4B35", // re-mapped to vermilion for luxury accent
          blueDark: "#E03E29",
          blueLight: "#FF6452",
          cyan: "#FF4B35",
          cyanDark: "#E03E29",
          slate: "#7A756B",
          slateLight: "#A8A295",
          softBlue: "rgba(255, 75, 53, 0.10)",
          paleCyan: "rgba(255, 75, 53, 0.05)",
          lightBg: "#F1EBDD",
          lightSurface: "#FAF7F0",
          darkBg: "#111318",
          darkSurface: "#181A20",
          darkElevated: "#22252D",
          borderLight: "#DDD5C3",
          borderDark: "#2A2E38",
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
