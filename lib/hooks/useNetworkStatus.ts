/**
 * React hook for monitoring network online/offline status
 */

import { useState, useEffect } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initialize with current status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    // Set up event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
