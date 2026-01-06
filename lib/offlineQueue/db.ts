/**
 * IndexedDB wrapper for offline submission queue
 * 
 * This module provides a simple abstraction over IndexedDB for storing
 * and managing queued form submissions when offline or when network
 * requests fail.
 */

import { QueuedSubmission, QueueStatus } from "./types";

const DB_NAME = "VBCLOfflineQueue";
const DB_VERSION = 1;
const STORE_NAME = "submissionQueue";

/**
 * Opens the IndexedDB database, creating it if necessary
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB not available in server context"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create the submissionQueue store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        
        // Create indexes for efficient querying
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

/**
 * Add a submission to the queue
 */
export async function enqueueSubmission(
  submission: QueuedSubmission
): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(submission);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to enqueue submission"));

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all submissions with a specific status, ordered by createdAt
 */
export async function getSubmissionsByStatus(
  status: QueueStatus
): Promise<QueuedSubmission[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.getAll(status);

    request.onsuccess = () => {
      const submissions = request.result as QueuedSubmission[];
      // Sort by createdAt (oldest first)
      submissions.sort((a, b) => a.createdAt - b.createdAt);
      resolve(submissions);
    };

    request.onerror = () => reject(new Error("Failed to get submissions"));

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all queued submissions (status: "queued")
 */
export async function getQueuedSubmissions(): Promise<QueuedSubmission[]> {
  return getSubmissionsByStatus("queued");
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(
  id: string
): Promise<QueuedSubmission | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => reject(new Error("Failed to get submission"));

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Update a submission's status and other fields
 */
export async function updateSubmission(
  id: string,
  updates: Partial<QueuedSubmission>
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    // First get the existing record
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error("Submission not found"));
        return;
      }

      // Merge updates
      const updated = { ...existing, ...updates };
      const putRequest = store.put(updated);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error("Failed to update submission"));
    };

    getRequest.onerror = () => reject(new Error("Failed to get submission for update"));

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a submission from the queue
 */
export async function deleteSubmission(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to delete submission"));

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get count of submissions by status
 */
export async function getSubmissionCount(status?: QueueStatus): Promise<number> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    if (status) {
      const index = store.index("status");
      const request = index.count(status);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Failed to count submissions"));
    } else {
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Failed to count submissions"));
    }

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all submissions (for testing/debugging)
 */
export async function clearAllSubmissions(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to clear submissions"));

    transaction.oncomplete = () => db.close();
  });
}
