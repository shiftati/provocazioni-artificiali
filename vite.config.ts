import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change this base URL if deploying to a different repository or custom domain.
// For local preview or root domains, change to "/" or "./".
export const REPO_BASE = "/provocazioni-artificiali-antigravity/";

export default defineConfig({
  base: REPO_BASE,
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
