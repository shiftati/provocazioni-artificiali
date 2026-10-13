import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
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

// Register PWA Service Worker with full offline precache & auto-updates
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent("sw-update-available", { detail: { updateSW } })
    );
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("sw-offline-ready"));
  },
});

// Expose update handler globally for UI triggers
(window as unknown as { __updateSW?: typeof updateSW }).__updateSW = updateSW;

