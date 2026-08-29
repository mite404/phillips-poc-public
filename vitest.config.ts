import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    exclude: [".worktrees/**", "node_modules/**", "dist/**"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
