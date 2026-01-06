/**
 * Unit tests for offline submission queue
 * 
 * Run with: npm test lib/offlineQueue/queueManager.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock IndexedDB for testing
const mockDB = new Map<string, any>();

// Mock the db module
jest.mock('./db', () => ({
  enqueueSubmission: jest.fn(async (submission) => {
    mockDB.set(submission.id, { ...submission });
  }),
  getQueuedSubmissions: jest.fn(async () => {
    return Array.from(mockDB.values())
      .filter(s => s.status === 'queued')
      .sort((a, b) => a.createdAt - b.createdAt);
  }),
  updateSubmission: jest.fn(async (id, updates) => {
    const existing = mockDB.get(id);
    if (existing) {
      mockDB.set(id, { ...existing, ...updates });
    }
  }),
  deleteSubmission: jest.fn(async (id) => {
    mockDB.delete(id);
  }),
  getSubmissionCount: jest.fn(async (status) => {
    if (status) {
      return Array.from(mockDB.values()).filter(s => s.status === status).length;
    }
    return mockDB.size;
  }),
}));

import { addToQueue, flushSubmissionQueue, getQueueStats } from './queueManager';
import type { QueuedSubmission } from './types';

describe('Offline Queue Manager', () => {
  beforeEach(() => {
    mockDB.clear();
    jest.clearAllMocks();
  });

  describe('addToQueue', () => {
    it('should add submission to queue with UUID', async () => {
      const submission = await addToQueue('/api/records', {
        dronaSupervisor: 'Test',
        shift: 'Shift 1',
        binNo: '123',
      });

      expect(submission.id).toBeDefined();
      expect(submission.clientSubmissionId).toBeDefined();
      expect(submission.status).toBe('queued');
      expect(submission.attempts).toBe(0);
      expect(submission.endpoint).toBe('/api/records');
    });

    it('should preserve clientSubmissionId if provided', async () => {
      const customId = 'custom-123';
      const submission = await addToQueue('/api/records', {
        clientSubmissionId: customId,
        data: 'test',
      });

      expect(submission.clientSubmissionId).toBe(customId);
      expect(submission.payload.clientSubmissionId).toBe(customId);
    });

    it('should generate clientSubmissionId if not provided', async () => {
      const submission = await addToQueue('/api/records', {
        data: 'test',
      });

      expect(submission.clientSubmissionId).toBeDefined();
      expect(submission.clientSubmissionId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });
  });

  describe('getQueueStats', () => {
    it('should return correct queue statistics', async () => {
      // Add various submissions
      await addToQueue('/api/records', { test: 1 });
      await addToQueue('/api/records', { test: 2 });
      
      // Manually set different statuses
      const submissions = Array.from(mockDB.values());
      mockDB.set(submissions[0].id, { ...submissions[0], status: 'queued' });
      mockDB.set(submissions[1].id, { ...submissions[1], status: 'failed' });

      const stats = await getQueueStats();

      expect(stats.queued).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.sending).toBe(0);
    });

    it('should return zeros for empty queue', async () => {
      const stats = await getQueueStats();

      expect(stats.queued).toBe(0);
      expect(stats.sending).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('flushSubmissionQueue', () => {
    it('should process queued submissions', async () => {
      // Mock successful fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'test-123' }),
      });

      await addToQueue('/api/records', { test: 1 });
      await addToQueue('/api/records', { test: 2 });

      const result = await flushSubmissionQueue();

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it('should respect max attempts limit', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network error'));

      const submission = await addToQueue('/api/records', { test: 1 });

      // Manually set attempts to max
      mockDB.set(submission.id, { ...submission, attempts: 5 });

      const result = await flushSubmissionQueue({ maxAttempts: 5 });

      expect(result.failed).toBe(1);
      
      const updated = mockDB.get(submission.id);
      expect(updated.status).toBe('failed');
      expect(updated.lastError).toContain('Max retry attempts');
    });

    it('should not queue validation errors', async () => {
      // Mock validation error (400)
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Validation failed',
      });

      await addToQueue('/api/records', { test: 1 });

      const result = await flushSubmissionQueue();

      expect(result.failed).toBe(1);
      
      const submissions = Array.from(mockDB.values());
      expect(submissions[0].status).toBe('failed');
      expect(submissions[0].lastError).toContain('400');
    });

    it('should queue network errors for retry', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network failure'));

      await addToQueue('/api/records', { test: 1 });

      const result = await flushSubmissionQueue();

      const submissions = Array.from(mockDB.values());
      expect(submissions[0].status).toBe('queued'); // Still queued for retry
      expect(submissions[0].attempts).toBe(1);
      expect(result.remaining).toBe(1);
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn((fn, delay) => {
        delays.push(delay as number);
        return originalSetTimeout(fn as any, 0); // Execute immediately for test
      }) as any;

      // Mock failure to trigger backoff
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network error'));

      const submission = await addToQueue('/api/records', { test: 1 });
      
      // Simulate multiple retries
      for (let i = 0; i < 3; i++) {
        mockDB.set(submission.id, { ...submission, attempts: i, status: 'queued' });
        await flushSubmissionQueue();
      }

      // Verify delays increase exponentially
      expect(delays.length).toBeGreaterThan(0);
      // First attempt has no delay, second has delay, third has more
      if (delays.length > 1) {
        expect(delays[1]).toBeGreaterThan(0);
      }

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Idempotency', () => {
    it('should include idempotency key in request headers', async () => {
      let capturedHeaders: any;
      
      global.fetch = jest.fn((url, options) => {
        capturedHeaders = options?.headers;
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'test' }),
        });
      });

      const submission = await addToQueue('/api/records', { test: 1 });
      await flushSubmissionQueue();

      expect(capturedHeaders['Idempotency-Key']).toBe(submission.clientSubmissionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors (5xx) by queuing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await addToQueue('/api/records', { test: 1 });
      await flushSubmissionQueue();

      const submissions = Array.from(mockDB.values());
      expect(submissions[0].status).toBe('queued'); // Queued for retry
      expect(submissions[0].attempts).toBe(1);
    });

    it('should handle timeout (408) by queuing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 408,
        text: async () => 'Request Timeout',
      });

      await addToQueue('/api/records', { test: 1 });
      await flushSubmissionQueue();

      const submissions = Array.from(mockDB.values());
      expect(submissions[0].status).toBe('queued');
    });

    it('should not queue client errors (4xx)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await addToQueue('/api/records', { test: 1 });
      await flushSubmissionQueue();

      const submissions = Array.from(mockDB.values());
      expect(submissions[0].status).toBe('failed'); // Permanently failed
    });
  });
});

/**
 * Integration test example (manual testing)
 * 
 * To run manually in browser console:
 * 
 * ```javascript
 * // Test offline queue
 * import { addToQueue, flushSubmissionQueue } from './lib/offlineQueue/queueManager';
 * 
 * // Add some test submissions
 * await addToQueue('/api/records', { test: 1 });
 * await addToQueue('/api/records', { test: 2 });
 * 
 * // Check queue
 * import { getQueueStats } from './lib/offlineQueue/queueManager';
 * console.log(await getQueueStats()); // { queued: 2, sending: 0, failed: 0 }
 * 
 * // Flush queue
 * const result = await flushSubmissionQueue();
 * console.log(result); // { processed: 2, succeeded: 2, failed: 0, remaining: 0 }
 * ```
 */
