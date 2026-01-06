/**
 * Type definitions for the offline submission queue system
 */

export type QueueStatus = "queued" | "sending" | "sent" | "failed";

/**
 * Represents a submission queued for later processing
 */
export interface QueuedSubmission {
  /** Unique identifier (UUID) */
  id: string;
  /** Timestamp when this was queued */
  createdAt: number;
  /** API endpoint to POST to */
  endpoint: string;
  /** JSON-serializable payload */
  payload: Record<string, any>;
  /** Number of send attempts made */
  attempts: number;
  /** Current status */
  status: QueueStatus;
  /** Last error message if failed */
  lastError?: string;
  /** Idempotency key for preventing duplicates */
  clientSubmissionId: string;
}

/**
 * Result returned from submitWithOfflineQueue
 */
export interface SubmissionResult {
  /** Whether submission succeeded immediately */
  success: boolean;
  /** Whether submission was queued for later */
  queued: boolean;
  /** Server response data (if immediate success) */
  data?: any;
  /** Error message (if immediate failure) */
  error?: string;
  /** The queued submission record (if queued) */
  queuedItem?: QueuedSubmission;
}

/**
 * Options for queue flushing behavior
 */
export interface FlushOptions {
  /** Maximum number of retry attempts per item (default: 5) */
  maxAttempts?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Maximum delay for exponential backoff in ms (default: 30000) */
  maxDelay?: number;
}
