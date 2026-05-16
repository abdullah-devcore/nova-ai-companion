"use client";

import { useEffect } from "react";

export function usePWAInstall() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    }

    // Handle install prompt
    let deferredPrompt: any;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Store for later use - can be triggered by a button
      window.addEventListener("__pwa_install_prompt", () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt = null;
        }
      });
    });

    // Handle successful installation
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App installed successfully");
    });

    // Detect standalone mode (app is installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      console.log("[PWA] Running in standalone mode");
    }
  }, []);
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
