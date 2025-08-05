import type { Config } from "tailwindcss";
import flowbitePlugin from "flowbite/plugin";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js", // Flowbite component detection
  ],
  darkMode: "class", // or 'media' if you prefer
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Add Inter or your custom font
      },
      colors: {
        brand: {
          DEFAULT: "#1E40AF", // example custom color
        },
      },
    },
  },
  plugins: [
    flowbitePlugin, // Enable Flowbite plugin
  ],
};

export default config;
