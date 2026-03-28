import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { ErrorBoundary } from "@shared/components/ErrorBoundary";
import { installGlobalErrorMonitoring } from "@shared/lib/logger";
import { isLikelyStaleChunkReason, reloadOnceForStaleChunk } from "@shared/lib/chunkLoadRecovery";

globalThis.addEventListener("vite:preloadError", () => {
  reloadOnceForStaleChunk();
});

globalThis.addEventListener("unhandledrejection", (event) => {
  if (isLikelyStaleChunkReason(event.reason)) {
    event.preventDefault();
    reloadOnceForStaleChunk();
  }
});

globalThis.addEventListener(
  "error",
  (event) => {
    const msg = event.message || "";
    if (msg && isLikelyStaleChunkReason(msg)) {
      event.preventDefault();
      reloadOnceForStaleChunk();
    }
  },
  true,
);

installGlobalErrorMonitoring();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
