/**
 * Submission wrapper with offline queue support
 * 
 * This module provides the main entry point for form submissions,
 * automatically handling offline scenarios and network failures.
 */

import { v4 as uuidv4 } from "uuid";
import { SubmissionResult } from "./types";
import { addToQueue } from "./queueManager";

/**
 * Check if the browser is currently online
 */
function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

/**
 * Check if an error is network-related
 */
function isNetworkError(error: any): boolean {
  if (error instanceof TypeError) return true;
  
  const message = error?.message?.toLowerCase() || "";
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("offline") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("failed to fetch")
  );
}

/**
 * Submit data with offline queue support
 * 
 * This function wraps your form submission logic:
 * - If offline: immediately queues the submission
 * - If online: attempts the request
 *   - Success: returns success result
 *   - Network failure: queues for later
 *   - Validation error (4xx): returns error (does not queue)
 * 
 * @param endpoint - API endpoint to POST to (e.g., "/api/records")
 * @param payload - Request payload
 * @param options - Optional fetch options (will be merged)
 * @returns SubmissionResult indicating success, queued, or error
 */
export async function submitWithOfflineQueue(
  endpoint: string,
  payload: Record<string, any>,
  options: RequestInit = {}
): Promise<SubmissionResult> {
  // Ensure payload has a clientSubmissionId for idempotency
  if (!payload.clientSubmissionId) {
    payload.clientSubmissionId = uuidv4();
  }

  // If offline, immediately queue
  if (!isOnline()) {
    const queuedItem = await addToQueue(endpoint, payload);
    return {
      success: false,
      queued: true,
      queuedItem,
    };
  }

  // Online - attempt the request
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": payload.clientSubmissionId,
        ...options.headers,
      },
      body: JSON.stringify(payload),
      ...options,
    });

    // Success
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        queued: false,
        data,
      };
    }

    // Network-related status codes (408, 5xx) - queue for retry
    if (response.status === 408 || response.status === 0 || response.status >= 500) {
      const queuedItem = await addToQueue(endpoint, payload);
      return {
        success: false,
        queued: true,
        queuedItem,
        error: `Server error (${response.status}), queued for retry`,
      };
    }

    // Client errors (4xx except 408) - don't queue, return error
    const errorText = await response.text();
    return {
      success: false,
      queued: false,
      error: `Validation error: ${errorText || response.statusText}`,
    };

  } catch (error: any) {
    // Network error - queue for later
    if (isNetworkError(error)) {
      const queuedItem = await addToQueue(endpoint, payload);
      return {
        success: false,
        queued: true,
        queuedItem,
        error: "Network error, queued for retry",
      };
    }

    // Other errors - don't queue
    return {
      success: false,
      queued: false,
      error: error.message || "Submission failed",
    };
  }
}

/**
 * Submit using PATCH method with offline queue support
 * 
 * Similar to submitWithOfflineQueue but for PATCH requests (updates)
 */
export async function patchWithOfflineQueue(
  endpoint: string,
  payload: Record<string, any>,
  options: RequestInit = {}
): Promise<SubmissionResult> {
  // Ensure payload has a clientSubmissionId
  if (!payload.clientSubmissionId) {
    payload.clientSubmissionId = uuidv4();
  }

  // If offline, queue as a PATCH request
  if (!isOnline()) {
    const queuedItem = await addToQueue(endpoint, {
      ...payload,
      _method: "PATCH", // Store the intended method
    });
    return {
      success: false,
      queued: true,
      queuedItem,
    };
  }

  // Online - attempt the request
  try {
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": payload.clientSubmissionId,
        ...options.headers,
      },
      body: JSON.stringify(payload),
      ...options,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        queued: false,
        data,
      };
    }

    // Network-related errors - queue
    if (response.status === 408 || response.status === 0 || response.status >= 500) {
      const queuedItem = await addToQueue(endpoint, {
        ...payload,
        _method: "PATCH",
      });
      return {
        success: false,
        queued: true,
        queuedItem,
        error: `Server error (${response.status}), queued for retry`,
      };
    }

    // Client errors - don't queue
    const errorText = await response.text();
    return {
      success: false,
      queued: false,
      error: `Validation error: ${errorText || response.statusText}`,
    };

  } catch (error: any) {
    if (isNetworkError(error)) {
      const queuedItem = await addToQueue(endpoint, {
        ...payload,
        _method: "PATCH",
      });
      return {
        success: false,
        queued: true,
        queuedItem,
        error: "Network error, queued for retry",
      };
    }

    return {
      success: false,
      queued: false,
      error: error.message || "Submission failed",
    };
  }
}
