# Auto-Save Functionality Documentation

## Overview

The application now includes a comprehensive auto-save system that automatically persists form data in real-time, protecting against data loss from browser crashes, accidental page refreshes, or navigation away from the form.

## Features

### 1. Real-Time Auto-Save
- **Automatic Capture**: All form fields (text inputs, dropdowns, date/time pickers, checkboxes, etc.) are automatically saved as users type
- **Debounced Saving**: Changes are saved after 1 second of inactivity to optimize performance
- **Visual Feedback**: Users see clear indicators showing when data is being saved or has been saved

### 2. Data Persistence
- **Browser Storage**: Data is stored in localStorage for persistence across sessions
- **Session Tracking**: Each session has a unique identifier to prevent conflicts
- **Data Expiration**: Auto-saved data expires after 24 hours to prevent stale data
- **Size Validation**: Data size is checked to ensure it stays within browser limits (500KB default)

### 3. Auto-Restore
- **Seamless Recovery**: When returning to the form, previously saved data is automatically restored
- **Record Matching**: Restored data is matched to the specific record being edited or new entry
- **Visual Indicator**: A badge shows when data has been restored from auto-save

### 4. Data Integrity
- **Input Sanitization**: All form data is sanitized before saving to prevent XSS attacks
- **Validation**: Data structure and age are validated before restoration
- **Error Handling**: Comprehensive error handling with user-friendly messages

### 5. User Warnings
- **Navigation Warning**: Users are warned when attempting to close the page with unsaved changes
- **Browser Compatibility**: System checks for required browser features on load
- **Cancel Confirmation**: Canceling the form prompts user to confirm data discard

## Technical Implementation

### Components Updated

#### RecordForm.tsx
The main form component now includes:
- Auto-save state management
- Session ID tracking
- Debounced save triggers
- Data restoration logic
- beforeunload event handlers
- Visual status indicators

### New Utility Files

#### lib/autoSaveUtils.ts
Provides utility functions for:
- Data validation and sanitization
- Safe JSON parsing/stringification
- Browser compatibility checks
- Data size calculations
- LocalStorage availability checks

#### lib/hooks/useAutoSave.ts
A reusable React hook that can be used in any form component:

```typescript
import { useAutoSave } from '@/lib/hooks/useAutoSave';

const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
  key: 'my_form_autosave',
  debounceMs: 1000,
  maxAgeMs: 24 * 60 * 60 * 1000,
  recordId: record?.id,
  enabled: true,
});
```

## User Experience

### Status Indicators

1. **Saving Indicator**
   - Appears in the header next to the form title
   - Shows spinning icon with "Saving..." text
   - Displayed while save is in progress

2. **Saved Indicator**
   - Replaces saving indicator after successful save
   - Shows checkmark icon with "Auto-saved" text
   - Displayed for 2 seconds, then fades

3. **Footer Status**
   - Shows "Changes auto-saved" with checkmark
   - Provides persistent confirmation at bottom of form

4. **Restored Data Badge**
   - Yellow badge in header when data is restored
   - Text: "Restored from auto-save"
   - Helps users understand their data was recovered

### User Workflows

#### Scenario 1: Accidental Browser Close
1. User opens "New Entry" and starts filling form
2. Auto-save runs in background every 1 second
3. User accidentally closes browser
4. User reopens browser and navigates to form
5. Data is automatically restored
6. Badge indicates "Restored from auto-save"

#### Scenario 2: Intentional Navigation Away
1. User fills form partially
2. User clicks back button or navigates away
3. Browser shows warning: "You have unsaved changes..."
4. If user proceeds, data remains in localStorage
5. When user returns, data is automatically restored

#### Scenario 3: Form Submission
1. User fills and submits form successfully
2. Auto-save data is automatically cleared
3. No stale data remains in localStorage

#### Scenario 4: Form Cancellation
1. User clicks "Cancel" button
2. System prompts: "Are you sure? This will discard auto-saved data"
3. If confirmed, auto-save data is cleared
4. Form closes without saving

## Data Security

### Sanitization
All form data is sanitized before saving to prevent:
- Script injection attacks
- XSS vulnerabilities
- Malicious code execution

Sanitization removes:
- `<script>` tags
- `javascript:` protocols
- Event handler attributes (onclick, onload, etc.)

### Storage Security
- Data is stored only in browser's localStorage (client-side)
- No sensitive data transmission without explicit submission
- Session IDs prevent data mixing between sessions
- Data expires automatically after 24 hours

### Browser Compatibility
The system checks for:
- localStorage support
- sessionStorage support
- beforeunload event support

If any feature is missing, graceful degradation occurs with appropriate warnings.

## API Reference

### Constants

```typescript
const AUTO_SAVE_KEY = 'record_form_autosave';
const AUTO_SAVE_DEBOUNCE_MS = 1000;
const SESSION_ID_KEY = 'record_form_session_id';
```

### Helper Functions

#### generateSessionId()
Generates a unique session identifier combining timestamp and random string.

```typescript
const sessionId = generateSessionId();
// Returns: "1703601234567_a4k3j2h9"
```

#### getSessionId()
Retrieves or creates session ID from sessionStorage.

```typescript
const sessionId = getSessionId();
```

### Auto-Save Data Structure

```typescript
interface AutoSavePayload {
  formData: RecordFormData;
  dateValue: string | null;
  inTimeValue: string | null;
  outTimeValue: string | null;
  selectedEmployees: Employee[];
  sessionId: string;
  timestamp: number;
  recordId: string | null;
}
```

## Configuration

### Adjusting Debounce Time

To change how quickly auto-save triggers:

```typescript
const AUTO_SAVE_DEBOUNCE_MS = 2000; // Save after 2 seconds of inactivity
```

### Changing Data Expiration

To modify how long data persists:

```typescript
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours
```

### Adjusting Max Data Size

In `autoSaveUtils.ts`:

```typescript
export const isDataSizeSafe = (data: any, maxSizeKB: number = 1000): boolean => {
  // Increases limit to 1MB
}
```

## Troubleshooting

### Auto-Save Not Working

**Check 1: Browser Compatibility**
```typescript
import { checkBrowserCompatibility } from '@/lib/autoSaveUtils';

const { compatible, features } = checkBrowserCompatibility();
console.log('Compatible:', compatible);
console.log('Features:', features);
```

**Check 2: LocalStorage Available**
```typescript
import { isLocalStorageAvailable } from '@/lib/autoSaveUtils';

if (!isLocalStorageAvailable()) {
  console.error('localStorage is not available');
}
```

**Check 3: Data Size**
```typescript
import { getDataSize, isDataSizeSafe } from '@/lib/autoSaveUtils';

const size = getDataSize(formData);
console.log('Data size:', size, 'bytes');
console.log('Is safe:', isDataSizeSafe(formData));
```

### Data Not Restoring

**Possible Causes:**
1. Data is older than 24 hours (expired)
2. Different record ID (editing different entry)
3. Session ID mismatch
4. Corrupted localStorage data

**Solution:**
```typescript
// Clear all auto-save data
import { clearAllAutoSaveData } from '@/lib/autoSaveUtils';
clearAllAutoSaveData();
```

### Performance Issues

If auto-save is causing slowdowns:

1. Increase debounce time
2. Reduce data size by excluding non-essential fields
3. Check browser's localStorage quota

## Best Practices

### For Developers

1. **Always Clear on Success**
   ```typescript
   clearAutoSaveData(); // After successful submission
   ```

2. **Validate Before Restore**
   ```typescript
   const restored = restoreFromLocalStorage();
   if (restored) {
     // Validate restored data
   }
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     saveToLocalStorage();
   } catch (error) {
     console.error('Auto-save failed:', error);
     // Show user-friendly message
   }
   ```

4. **Test Edge Cases**
   - Very large forms
   - Slow connections
   - Browser storage limits
   - Multiple tabs/windows

### For Users

1. **Trust the Auto-Save**: The system saves automatically - no need to manually save frequently
2. **Look for Indicators**: Check for "Auto-saved" badge to confirm data is safe
3. **Don't Clear Browser Data**: Clearing cache/localStorage will delete auto-saved data
4. **Submit When Ready**: Auto-save is backup - always submit when complete

## Browser Support

### Fully Supported
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Partial Support
- IE 11 (localStorage supported, but some features may not work)

### Not Supported
- Browsers with localStorage disabled
- Private/Incognito mode (may have limited storage)

## Future Enhancements

Potential improvements for future versions:

1. **Cloud Sync**: Sync auto-save data to backend for cross-device access
2. **Version History**: Keep multiple auto-save versions for rollback
3. **Conflict Resolution**: Handle conflicts when same form edited in multiple tabs
4. **Compression**: Compress data before saving to increase capacity
5. **Encryption**: Encrypt sensitive data in localStorage
6. **Custom Triggers**: Allow manual save triggers via hotkeys
7. **Analytics**: Track auto-save usage and success rates

## Support

For issues or questions about the auto-save functionality:

1. Check this documentation first
2. Review browser console for error messages
3. Test with browser DevTools open to see localStorage updates
4. Contact development team with specific error details

## License

This auto-save implementation is part of the main application and follows the same license terms.

---

**Last Updated**: December 26, 2025
**Version**: 1.0.0
