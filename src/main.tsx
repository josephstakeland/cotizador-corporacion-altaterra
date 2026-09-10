import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

async function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (import.meta.env.DEV) {
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    return;
  }
  await navigator.serviceWorker.register("/sw.js");
}

void setupServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
