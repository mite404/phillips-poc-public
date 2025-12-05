import("tailwindcss").Config;
import animate from "tailwindcss-animate";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        phillips: {
          blue: "hsl(var(--phillips-blue))",
          red: "hsl(var(--phillips-red))",
          // gray: "#F3F4F6", // Background Gray
        },
      },
    },
  },
  plugins: [animate],
};
