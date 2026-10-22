import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Set to "/" for custom domain (e.g. codemotion.shiftati.it)
export const REPO_BASE = "/";

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: {
        enabled: true,
        type: "classic",
        navigateFallback: `${REPO_BASE}index.html`,
      },
      manifest: {
        name: "Shiftati di Testa | Codemotion Milano 2026",
        short_name: "Shiftati",
        description: "Il Talk dei Shiftati di Testa sul palco di Codemotion Milano 28-29 Ottobre 2026",
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
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        inlineWorkboxRuntime: true,
        navigateFallback: `${REPO_BASE}index.html`,
        navigateFallbackDenylist: [
          /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|mp3|wav|ogg|css|js|map|json)$/i,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }: { request: Request; url: URL }) =>
              request.destination === "image" ||
              /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request, url }: { request: Request; url: URL }) =>
              request.destination === "audio" ||
              /\.(?:mp3|wav|ogg)$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              rangeRequests: true,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request, url }: { request: Request; url: URL }) =>
              request.destination === "font" ||
              /\.(?:woff|woff2|ttf|eot)$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request, url }: { request: Request; url: URL }) =>
              request.destination === "style" ||
              request.destination === "script" ||
              request.destination === "worker" ||
              /\.(?:js|css)$/i.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
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

