import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://phillipsx-pims-stage.azurewebsites.net",
        changeOrigin: true,
        secure: false,
      },
      "/content-api": {
        target: "https://phillipsx-content-stage.azurewebsites.net/api",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
