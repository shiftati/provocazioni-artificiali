import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Change this base URL if deploying to a different repository or custom domain.
// For local preview or root domains, change to "/" or "./".
export const REPO_BASE = "/provocazioni-artificiali-antigravity/";

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "icons/*.png",
        "fonts/*.woff2",
        "images/**/*",
        "logo/*",
        "audio/*",
      ],
      manifest: {
        name: "Shiftati di Testa — Codemotion",
        short_name: "Shiftati",
        description: "Web app per talk e presentazione interattiva sul palco di Codemotion",
        lang: "it",
        theme_color: "#0e1e30",
        background_color: "#0e1e30",
        display: "standalone",
        orientation: "any",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        // Precache all assets (js, css, html, slides images, audio, fonts, icons) so the app works 100% offline
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,webmanifest,mp3,wav,ogg}",
        ],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: `${REPO_BASE}index.html`,
      },
    }),
  ],
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

