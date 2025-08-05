import type { Config } from "tailwindcss";
import flowbitePlugin from "flowbite/plugin";
import daisyui from "daisyui"; // 👈 Add this

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/daisyui/**/*.js", 
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#1E40AF",
        },
      },
    },
  },
  plugins: [
    flowbitePlugin,
    daisyui, // 👈 Add this
  ],
};

export default config;
