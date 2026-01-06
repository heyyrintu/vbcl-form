/**
 * React hook for monitoring submission queue status
 */

import { useState, useEffect, useCallback } from "react";
import { getQueueStats } from "../offlineQueue/queueManager";

interface QueueStatus {
  queued: number;
  sending: number;
  failed: number;
  total: number;
}

/**
 * Hook to monitor the submission queue status
 * 
 * @param pollInterval - How often to check queue status in ms (default: 2000)
 */
export function useQueueStatus(pollInterval: number = 2000) {
  const [status, setStatus] = useState<QueueStatus>({
    queued: 0,
    sending: 0,
    failed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setStatus({
        ...stats,
        total: stats.queued + stats.sending + stats.failed,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch queue status:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Set up polling
    const interval = setInterval(refreshStatus, pollInterval);

    // Listen for custom events from queue operations
    const handleQueueChange = () => {
      refreshStatus();
    };

    window.addEventListener("queueChanged", handleQueueChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener("queueChanged", handleQueueChange);
    };
  }, [refreshStatus, pollInterval]);

  return {
    ...status,
    isLoading,
    refresh: refreshStatus,
  };
}

/**
 * Dispatch a custom event to notify queue changes
 * Call this after queue operations to trigger immediate UI updates
 */
export function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("queueChanged"));
  }
}
