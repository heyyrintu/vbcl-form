"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register service worker
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("[PWA] Service Worker registered with scope:", registration.scope);

                    // Check for updates
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    // New content is available, show refresh prompt if needed
                                    console.log("[PWA] New content available, please refresh.");
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error("[PWA] Service Worker registration failed:", error);
                });

            // Handle controller change (new service worker activated)
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                console.log("[PWA] New Service Worker activated");
            });
        }
    }, []);

    return null;
}

// Hook to check if app is installed as PWA
export function useIsPWA() {
    if (typeof window === "undefined") return false;

    // Check if running in standalone mode (installed PWA)
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

// Hook to check if app can be installed
export function useInstallPrompt() {
    useEffect(() => {
        let deferredPrompt: BeforeInstallPromptEvent | null = null;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            deferredPrompt = e as BeforeInstallPromptEvent;
            // Store the event for later use
            (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt = deferredPrompt;
            console.log("[PWA] Install prompt available");
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);
}

// Type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}
