import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applySettings, loadSettings } from "./features/settings/useSettings";

// Apply persisted settings before first render (prevents flash of wrong theme/font)
applySettings(loadSettings());

const queryClient = new QueryClient();

// Register the service worker (production only) so the app can be installed to the home screen
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
