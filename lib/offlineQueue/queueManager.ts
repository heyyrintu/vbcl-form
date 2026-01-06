/**
 * Queue Manager for offline submission processing
 * 
 * This module handles the automatic flushing of queued submissions
 * with exponential backoff and retry logic.
 */

import { v4 as uuidv4 } from "uuid";
import {
  QueuedSubmission,
  FlushOptions,
  SubmissionResult,
} from "./types";
import {
  enqueueSubmission,
  getQueuedSubmissions,
  updateSubmission,
  deleteSubmission,
  getSubmissionCount,
} from "./db";

// Default configuration
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 30000; // 30 seconds

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempts: number,
  baseDelay: number = DEFAULT_BASE_DELAY,
  maxDelay: number = DEFAULT_MAX_DELAY
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
  // Add jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Check if an error is network-related (should queue)
 */
function isNetworkError(error: any): boolean {
  // TypeError is thrown for network failures in fetch
  if (error instanceof TypeError) return true;
  
  // Check for specific error messages
  const message = error?.message?.toLowerCase() || "";
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("offline") ||
    message.includes("timeout") ||
    message.includes("connection")
  );
}

/**
 * Check if HTTP status indicates a network/timeout error
 */
function isNetworkStatusCode(status: number): boolean {
  return status === 408 || status === 0 || status >= 500;
}

/**
 * Add a new submission to the queue
 */
export async function addToQueue(
  endpoint: string,
  payload: Record<string, any>
): Promise<QueuedSubmission> {
  const submission: QueuedSubmission = {
    id: uuidv4(),
    createdAt: Date.now(),
    endpoint,
    payload,
    attempts: 0,
    status: "queued",
    clientSubmissionId: payload.clientSubmissionId || uuidv4(),
  };

  // Ensure clientSubmissionId is in the payload
  submission.payload.clientSubmissionId = submission.clientSubmissionId;

  await enqueueSubmission(submission);
  return submission;
}

/**
 * Attempt to send a single queued submission
 */
async function sendQueuedSubmission(
  submission: QueuedSubmission
): Promise<boolean> {
  try {
    // Mark as sending
    await updateSubmission(submission.id, {
      status: "sending",
      attempts: submission.attempts + 1,
    });

    // Attempt the request
    const response = await fetch(submission.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": submission.clientSubmissionId,
      },
      body: JSON.stringify(submission.payload),
    });

    if (response.ok) {
      // Success - mark as sent and remove from queue
      await updateSubmission(submission.id, { status: "sent" });
      await deleteSubmission(submission.id);
      return true;
    }

    // Check if we should retry based on status code
    if (isNetworkStatusCode(response.status)) {
      throw new Error(`Server error: ${response.status}`);
    }

    // 4xx errors (except 408) should not be retried - mark as failed
    const errorText = await response.text();
    await updateSubmission(submission.id, {
      status: "failed",
      lastError: `HTTP ${response.status}: ${errorText}`,
    });
    return false;

  } catch (error: any) {
    // Network error - will retry if attempts remain
    const isNetwork = isNetworkError(error);
    
    if (!isNetwork) {
      // Non-network error - mark as failed
      await updateSubmission(submission.id, {
        status: "failed",
        lastError: error.message || "Unknown error",
      });
      return false;
    }

    // Network error - mark as queued for retry
    await updateSubmission(submission.id, {
      status: "queued",
      lastError: error.message || "Network error",
    });
    
    return false;
  }
}

/**
 * Flush the submission queue
 * 
 * Processes all queued submissions sequentially, with exponential backoff
 * for failed attempts. Returns statistics about the flush operation.
 */
export async function flushSubmissionQueue(
  options: FlushOptions = {}
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
}> {
  const maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
  const baseDelay = options.baseDelay || DEFAULT_BASE_DELAY;
  const maxDelay = options.maxDelay || DEFAULT_MAX_DELAY;

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Get all queued submissions
  const submissions = await getQueuedSubmissions();

  for (const submission of submissions) {
    // Check if max attempts reached
    if (submission.attempts >= maxAttempts) {
      await updateSubmission(submission.id, {
        status: "failed",
        lastError: `Max retry attempts (${maxAttempts}) exceeded`,
      });
      failed++;
      processed++;
      continue;
    }

    // Apply exponential backoff delay if this isn't the first attempt
    if (submission.attempts > 0) {
      const delay = calculateBackoffDelay(submission.attempts, baseDelay, maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Attempt to send
    const success = await sendQueuedSubmission(submission);
    
    processed++;
    if (success) {
      succeeded++;
    } else {
      // Check if it's now failed permanently
      const updated = await getSubmissionCount("failed");
      if (updated > failed) {
        failed++;
      }
    }
  }

  const remaining = await getSubmissionCount("queued");

  return { processed, succeeded, failed, remaining };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  queued: number;
  sending: number;
  failed: number;
}> {
  const [queued, sending, failed] = await Promise.all([
    getSubmissionCount("queued"),
    getSubmissionCount("sending"),
    getSubmissionCount("failed"),
  ]);

  return { queued, sending, failed };
}

/**
 * Retry all failed submissions
 */
export async function retryFailedSubmissions(): Promise<void> {
  const db = await import("./db");
  const failed = await db.getSubmissionsByStatus("failed");
  
  for (const submission of failed) {
    // Reset to queued with attempts reset
    await updateSubmission(submission.id, {
      status: "queued",
      attempts: 0,
      lastError: undefined,
    });
  }
}
