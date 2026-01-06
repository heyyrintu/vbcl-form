# Offline Mode / Poor Network Support Documentation

## Overview

The application now includes comprehensive offline support for form submissions. When users are offline or experience network failures, submissions are automatically queued and sent when connectivity returns.

## Features

### 1. **Automatic Queue Management**
- Submissions are automatically queued when:
  - User is offline (`navigator.onLine === false`)
  - Network request fails (timeout, connection error)
  - Server returns 5xx errors or 408 (Request Timeout)
- Queue persists across page reloads using IndexedDB
- Auto-flush on app startup and when network comes online
- Periodic background flush every 5 minutes

### 2. **Idempotency & Duplicate Prevention**
- Each submission gets a unique `clientSubmissionId` (UUID)
- Server caches responses for 24 hours to prevent duplicate processing
- Idempotency key sent via `Idempotency-Key` header
- Safe to retry failed submissions without creating duplicates

### 3. **Intelligent Retry Logic**
- Exponential backoff with jitter (1s → 2s → 4s → 8s → 16s → max 30s)
- Maximum 5 retry attempts per submission
- Network errors are retried, validation errors (4xx) are not
- Failed items marked after max attempts exceeded

### 4. **UI Feedback**
- **NetworkStatusIndicator** (bottom-right corner):
  - Shows online/offline status
  - Displays queued/sending/failed submission counts
  - Manual "Retry Queued Submissions" button
  - Auto-hides when online with empty queue
  
- **RecordForm Banners**:
  - Yellow banner when offline
  - Green success messages for queued submissions
  - Red error messages for failures

## Architecture

### Core Modules

#### `lib/offlineQueue/db.ts`
IndexedDB wrapper for queue storage:
- `enqueueSubmission()` - Add to queue
- `getQueuedSubmissions()` - Get all queued items
- `updateSubmission()` - Update status/attempts
- `deleteSubmission()` - Remove from queue
- `getSubmissionCount()` - Count by status

#### `lib/offlineQueue/queueManager.ts`
Queue processing logic:
- `addToQueue()` - Create queue entry with UUID
- `flushSubmissionQueue()` - Process all queued items
- `retryFailedSubmissions()` - Reset failed items to queued
- `getQueueStats()` - Get queue statistics

#### `lib/offlineQueue/submitWithQueue.ts`
Network-aware submission wrapper:
- `submitWithOfflineQueue()` - POST with offline handling
- `patchWithOfflineQueue()` - PATCH with offline handling
- Checks `navigator.onLine` before attempting
- Queues on network errors, returns error on validation failures

#### `lib/offlineQueue/types.ts`
TypeScript interfaces:
- `QueuedSubmission` - Queue entry structure
- `SubmissionResult` - Submission outcome
- `QueueStatus` - "queued" | "sending" | "sent" | "failed"
- `FlushOptions` - Retry configuration

### React Components

#### `components/NetworkStatusIndicator.tsx`
Floating status widget (bottom-right):
```tsx
// Shows:
- Online/Offline status with icon
- Queued submissions count
- Sending submissions count
- Failed submissions count
- Manual retry button
- Status messages
```

#### `components/QueueInitializer.tsx`
Background initialization:
```tsx
// Responsibilities:
- Flush queue on app startup
- Listen for 'online' event and auto-flush
- Periodic flush every 5 minutes
- Console logging for debugging
```

### React Hooks

#### `lib/hooks/useNetworkStatus.ts`
```tsx
const isOnline = useNetworkStatus();
// Returns boolean, updates on online/offline events
```

#### `lib/hooks/useQueueStatus.ts`
```tsx
const { queued, sending, failed, total, refresh } = useQueueStatus();
// Polls every 2 seconds, can be manually refreshed
```

### API Updates

#### `app/api/records/route.ts` (POST)
```typescript
// Checks Idempotency-Key header
// Returns cached response for duplicate keys
// Caches successful responses for 24 hours
```

#### `app/api/records/[id]/route.ts` (PATCH)
```typescript
// Same idempotency logic
// Cache key includes record ID: `${id}:${idempotencyKey}`
```

## Usage in Forms

### RecordForm Integration

```typescript
import { submitWithOfflineQueue, patchWithOfflineQueue } from "@/lib/offlineQueue/submitWithQueue";
import { notifyQueueChanged } from "@/lib/hooks/useQueueStatus";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

// Check network status
const isOnline = useNetworkStatus();

// Submit with offline support
const result = await submitWithOfflineQueue("/api/records", payload);

if (result.success) {
  // Immediate success
  console.log("Submission successful", result.data);
} else if (result.queued) {
  // Queued for later
  console.log("Queued for sending when online", result.queuedItem);
  notifyQueueChanged(); // Update UI immediately
} else {
  // Failed (validation error)
  console.error("Submission failed", result.error);
}
```

## Testing

### 1. **Test Offline Queue**

```bash
# In browser DevTools:
1. Open Application > Service Workers
2. Check "Offline" checkbox
3. Fill and submit a form
4. Check Application > IndexedDB > VBCLOfflineQueue > submissionQueue
5. Uncheck "Offline"
6. Watch NetworkStatusIndicator auto-send queued items
```

### 2. **Test Network Failure**

```bash
# Simulate network failure:
1. Open DevTools > Network tab
2. Set throttling to "Offline" or "Slow 3G"
3. Submit form
4. Verify queued in IndexedDB
5. Reset throttling to "No throttling"
6. Observe auto-flush
```

### 3. **Test Duplicate Prevention**

```bash
# In DevTools Console:
const payload = { 
  dronaSupervisor: "Test",
  shift: "Shift 1",
  binNo: "123",
  modelNo: "ABC",
  chassisNo: "XYZ",
  type: "PTS",
  clientSubmissionId: "test-duplicate-123"
};

// Send twice with same ID
await fetch("/api/records", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": "test-duplicate-123"
  },
  body: JSON.stringify(payload)
});

// Second call returns cached response immediately
```

### 4. **Test Retry Logic**

```bash
# Manually trigger queue flush:
import { flushSubmissionQueue } from "@/lib/offlineQueue/queueManager";

const result = await flushSubmissionQueue();
console.log(result); 
// { processed: 2, succeeded: 1, failed: 0, remaining: 1 }
```

### 5. **Test Manual Retry Button**

```bash
1. Queue some submissions (go offline and submit)
2. Click NetworkStatusIndicator "Retry Queued Submissions"
3. Observe status messages
4. Check console logs for [OfflineQueue] messages
```

## Debugging

### Console Logs

The system logs queue operations:
```
[OfflineQueue] Initializing and flushing queue...
[OfflineQueue] ✓ Sent 3 queued submission(s)
[OfflineQueue] ⚠ 1 submission(s) still queued
[OfflineQueue] Network online, flushing queue...
[OfflineQueue] Periodic flush: sent 2 submission(s)
```

### Inspect Queue State

```javascript
// In DevTools Console:
import { getQueueStats } from "@/lib/offlineQueue/queueManager";
const stats = await getQueueStats();
console.log(stats); // { queued: 2, sending: 0, failed: 1 }
```

### Clear Queue (Testing Only)

```javascript
// WARNING: Deletes all queued submissions
import { clearAllSubmissions } from "@/lib/offlineQueue/db";
await clearAllSubmissions();
```

## Configuration

### Retry Settings

Edit `lib/offlineQueue/queueManager.ts`:
```typescript
const DEFAULT_MAX_ATTEMPTS = 5;        // Max retry attempts
const DEFAULT_BASE_DELAY = 1000;       // Initial delay (1s)
const DEFAULT_MAX_DELAY = 30000;       // Max delay (30s)
```

### Idempotency Cache TTL

Edit `app/api/records/route.ts`:
```typescript
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

### Queue Poll Interval

Edit `lib/hooks/useQueueStatus.ts`:
```typescript
export function useQueueStatus(pollInterval: number = 2000) {
  // Default: poll every 2 seconds
}
```

### Periodic Flush Interval

Edit `components/QueueInitializer.tsx`:
```typescript
const flushInterval = setInterval(async () => {
  // ...
}, 5 * 60 * 1000); // 5 minutes
```

## Production Considerations

### 1. **Idempotency Cache**

Current implementation uses in-memory cache. For production with multiple servers:

```typescript
// Replace Map with Redis:
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Check cache
const cached = await redis.get(`idempotency:${key}`);
if (cached) return JSON.parse(cached);

// Set cache
await redis.setex(`idempotency:${key}`, 86400, JSON.stringify(response));
```

### 2. **Database-backed Queue**

For server-side queue persistence:

```typescript
// Add Prisma model:
model SubmissionQueue {
  id                  String   @id @default(uuid())
  endpoint            String
  payload             Json
  attempts            Int      @default(0)
  status              String   // queued, sending, sent, failed
  clientSubmissionId  String   @unique
  lastError           String?
  createdAt           DateTime @default(now())
}
```

### 3. **Monitoring**

Add queue metrics:
```typescript
// Track queue depth, retry rates, failure reasons
// Alert on high queue depth or failure rates
// Monitor idempotency cache hit rate
```

## Security

- Client-generated UUIDs are unpredictable (crypto-random)
- Idempotency keys can't be guessed or enumerated
- Authentication required for all API endpoints
- Queue stored locally per-user (IndexedDB is origin-isolated)
- No sensitive data logged to console

## Browser Compatibility

- **IndexedDB**: All modern browsers (IE 10+)
- **navigator.onLine**: All modern browsers
- **Service Workers**: Optional, works without PWA features
- **UUID**: Uses `uuid` library for compatibility

## Known Limitations

1. **Queue Size**: IndexedDB has storage limits (~50MB-1GB depending on browser)
2. **Background Sync**: Doesn't use Background Sync API (requires Service Worker registration)
3. **Cross-device**: Queue is per-device, not synced across devices
4. **Offline Edits**: Can't fetch data while offline (only submit)
5. **Memory Cache**: Idempotency cache cleared on server restart

## Future Enhancements

- [ ] Background Sync API integration
- [ ] Persistent idempotency cache (Redis/Database)
- [ ] Queue compression for large payloads
- [ ] Conflict resolution for concurrent edits
- [ ] Analytics dashboard for queue metrics
- [ ] Push notifications for sent/failed submissions
- [ ] Offline data caching with Service Worker
- [ ] Queue export/import for debugging

## Troubleshooting

### Queue not flushing
- Check browser console for errors
- Verify `navigator.onLine` returns true
- Check IndexedDB in DevTools > Application
- Look for [OfflineQueue] logs

### Duplicate submissions
- Verify `Idempotency-Key` header is sent
- Check server logs for cache hits
- Ensure `clientSubmissionId` is unique

### Submissions stuck in "sending"
- Server might be processing slowly
- Check network tab for pending requests
- Status will revert to "queued" on next flush

### Failed submissions not retrying
- Check `attempts` count (max 5)
- Look at `lastError` field in IndexedDB
- Use manual retry button

## Support

For issues or questions:
1. Check browser console for [OfflineQueue] logs
2. Inspect IndexedDB state in DevTools
3. Review API server logs for errors
4. Test with network throttling in DevTools
