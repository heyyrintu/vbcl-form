/**
 * Network Status Indicator Component
 * 
 * Displays online/offline status and queued submission count.
 * Provides a button to manually retry failed submissions.
 */

"use client";

import { useState } from "react";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { useQueueStatus } from "@/lib/hooks/useQueueStatus";
import { flushSubmissionQueue, retryFailedSubmissions } from "@/lib/offlineQueue/queueManager";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();
  const { queued, sending, failed, total, refresh } = useQueueStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRetryQueue = async () => {
    setIsRetrying(true);
    setMessage(null);

    try {
      // First, reset any failed items to queued
      await retryFailedSubmissions();

      // Then flush the queue
      const result = await flushSubmissionQueue();

      if (result.succeeded > 0) {
        setMessage(`✓ ${result.succeeded} submission(s) sent successfully`);
      } else if (result.remaining > 0) {
        setMessage(`⚠ ${result.remaining} submission(s) still queued (will retry automatically)`);
      } else {
        setMessage("✓ Queue is empty");
      }

      // Refresh status
      await refresh();

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage("✗ Failed to process queue");
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't show if nothing is queued and we're online
  if (isOnline && total === 0 && !message) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
        {/* Network Status */}
        <div className="flex items-center gap-2 mb-3">
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Online
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Offline
              </span>
            </>
          )}
        </div>

        {/* Queue Status */}
        {total > 0 && (
          <div className="space-y-2 mb-3">
            {queued > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {queued} queued
                </span>
              </div>
            )}
            
            {sending > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {sending} sending
                </span>
              </div>
            )}
            
            {failed > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {failed} failed
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
            {message}
          </div>
        )}

        {/* Retry Button */}
        {(queued > 0 || failed > 0) && (
          <Button
            onClick={handleRetryQueue}
            disabled={isRetrying}
            size="sm"
            className="w-full bg-[#DE1C1C] hover:bg-[#DE1C1C]/90 text-white"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Queued Submissions
              </>
            )}
          </Button>
        )}

        {/* Auto-send notice */}
        {!isOnline && queued > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Will send automatically when online
          </p>
        )}
      </div>
    </div>
  );
}
