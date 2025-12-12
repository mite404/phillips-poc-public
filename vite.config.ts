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
        changeOrigin: true, // This is the magic setting that fixes it
        secure: false, // Helpful if staging has self-signed certs
      },
    },
  },
});
