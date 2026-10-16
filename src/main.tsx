import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applySettings, loadSettings } from "./features/settings/useSettings";

// Apply persisted settings before first render (prevents flash of wrong theme/font)
applySettings(loadSettings());

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
