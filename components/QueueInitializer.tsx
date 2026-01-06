/**
 * Queue Initialization Component
 * 
 * Initializes the offline queue system:
 * - Flushes queue on app startup
 * - Sets up auto-flush on network online event
 * - Handles background queue processing
 */

"use client";

import { useEffect } from "react";
import { flushSubmissionQueue } from "@/lib/offlineQueue/queueManager";
import { notifyQueueChanged } from "@/lib/hooks/useQueueStatus";

export function QueueInitializer() {
  useEffect(() => {
    // Flush queue on component mount (app startup)
    const initialFlush = async () => {
      try {
        console.log("[OfflineQueue] Initializing and flushing queue...");
        const result = await flushSubmissionQueue();
        
        if (result.succeeded > 0) {
          console.log(`[OfflineQueue] ✓ Sent ${result.succeeded} queued submission(s)`);
          notifyQueueChanged();
        }
        
        if (result.remaining > 0) {
          console.log(`[OfflineQueue] ⚠ ${result.remaining} submission(s) still queued`);
        }
      } catch (error) {
        console.error("[OfflineQueue] Failed to flush queue on startup:", error);
      }
    };

    initialFlush();

    // Set up online event listener for auto-flush
    const handleOnline = async () => {
      console.log("[OfflineQueue] Network online, flushing queue...");
      try {
        const result = await flushSubmissionQueue();
        
        if (result.succeeded > 0) {
          console.log(`[OfflineQueue] ✓ Sent ${result.succeeded} queued submission(s)`);
          notifyQueueChanged();
        }
      } catch (error) {
        console.error("[OfflineQueue] Failed to flush queue on online event:", error);
      }
    };

    window.addEventListener("online", handleOnline);

    // Periodic queue flush (every 5 minutes) as a backup
    const flushInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          const result = await flushSubmissionQueue();
          if (result.succeeded > 0) {
            console.log(`[OfflineQueue] Periodic flush: sent ${result.succeeded} submission(s)`);
            notifyQueueChanged();
          }
        } catch (error) {
          console.error("[OfflineQueue] Periodic flush failed:", error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(flushInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
