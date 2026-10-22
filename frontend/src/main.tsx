import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { env } from "@/config/env-config";

// With VITE_APP_ENABLE_API_MOCKING=true the MSW service worker answers API
// calls with the same handlers the tests use, so the app runs without a
// backend. Dynamically imported, so it is only loaded when enabled.
async function enableMocking() {
  if (!env.ENABLE_API_MOCKING) return;
  const { worker } = await import("@/tests/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
