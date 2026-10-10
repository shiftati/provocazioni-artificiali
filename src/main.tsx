import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { appStorage } from "./state/storage";
import "./styles/index.scss";

// Apply persisted theme immediately before render
document.documentElement.setAttribute("data-theme", appStorage.getTheme());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register handcrafted offline Service Worker in production only
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Determine SW URL based on Vite's configured base URL
    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const swUrl = `${baseUrl}sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Inform app shell that a new version is waiting
                window.dispatchEvent(new CustomEvent("sw-update-available"));
              }
            });
          }
        });
      })
      .catch(() => {
        // Silent offline degradation
      });
  });
}
