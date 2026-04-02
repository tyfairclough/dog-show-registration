import type { Config } from "tailwindcss/plugin";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      /* Warm surfaces inspired by essextherapydogs.co.uk */
      colors: {
        cream: {
          50: "#fafbf8",
          100: "#f5f8f2",
          200: "#e8efe3",
          300: "#d6e2ce",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            /* Soft cream page bg; cards stay light via components */
            background: "#F5F8F2",
            foreground: "#292929",
            /* Brand navy — matches essextherapydogs.co.uk header rgb(42, 38, 108) */
            primary: {
              50: "#EFEEF5",
              100: "#DFDDEB",
              200: "#BFBDD7",
              300: "#9F9CC3",
              400: "#7F7BAF",
              500: "#2A266C",
              600: "#221F56",
              700: "#1B1945",
              800: "#141434",
              900: "#0D0D23",
              DEFAULT: "#2A266C",
              foreground: "#FFFFFF",
            },
            /* Teal accent from site palette */
            secondary: {
              50: "#EFFCFB",
              100: "#D2F4F4",
              200: "#A5E8EA",
              300: "#6FD4D9",
              400: "#3CB8C2",
              500: "#0EA1BD",
              600: "#0C8299",
              700: "#0A687A",
              800: "#0D5563",
              900: "#0E474F",
              DEFAULT: "#0EA1BD",
              foreground: "#FFFFFF",
            },
            success: {
              50: "#F0FDF4",
              100: "#DCFCE7",
              200: "#BBF7D0",
              300: "#86EFAC",
              400: "#4ADE80",
              500: "#22C55E",
              600: "#16A34A",
              700: "#15803D",
              800: "#166534",
              900: "#14532D",
              DEFAULT: "#22C55E",
              foreground: "#FFFFFF",
            },
            warning: {
              50: "#FFFBEB",
              100: "#FEF3C7",
              200: "#FDE68A",
              300: "#FCD34D",
              400: "#FBBF24",
              500: "#F59E0B",
              600: "#D97706",
              700: "#B45309",
              800: "#92400E",
              900: "#78350F",
              DEFAULT: "#F59E0B",
              foreground: "#FFFFFF",
            },
            danger: {
              50: "#FEF2F2",
              100: "#FEE2E2",
              200: "#FECACA",
              300: "#FCA5A5",
              400: "#F87171",
              500: "#EF4444",
              600: "#DC2626",
              700: "#B91C1C",
              800: "#991B1B",
              900: "#7F1D1D",
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: "#1A2218",
            foreground: "#F4F8F0",
            primary: {
              50: "#0D0D23",
              100: "#141434",
              200: "#1B1945",
              300: "#221F56",
              400: "#2A266C",
              500: "#7F7BAF",
              600: "#9F9CC3",
              700: "#BFBDD7",
              800: "#DFDDEB",
              900: "#EFEEF5",
              DEFAULT: "#9F9CC3",
              foreground: "#0D0D23",
            },
            secondary: {
              50: "#0E474F",
              100: "#0D5563",
              200: "#0A687A",
              300: "#0C8299",
              400: "#0EA1BD",
              500: "#3CB8C2",
              600: "#6FD4D9",
              700: "#A5E8EA",
              800: "#D2F4F4",
              900: "#EFFCFB",
              DEFAULT: "#3CB8C2",
              foreground: "#1A2218",
            },
          },
        },
      },
    }),
  ],
};

export default config;
