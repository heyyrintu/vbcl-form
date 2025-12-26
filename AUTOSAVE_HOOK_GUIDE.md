# useAutoSave Hook - Developer Guide

## Quick Start

The `useAutoSave` hook provides an easy way to add auto-save functionality to any form component in your application.

### Basic Usage

```typescript
import { useAutoSave } from '@/lib/hooks/useAutoSave';

function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
    key: 'my_form_autosave',
    recordId: null, // or specific record ID
  });

  // Rest of your component...
}
```

## API Reference

### Hook Signature

```typescript
useAutoSave(data: any, options: AutoSaveOptions): [AutoSaveState, AutoSaveActions]
```

### Options Parameter

```typescript
interface AutoSaveOptions {
  key: string;                    // Required: localStorage key
  debounceMs?: number;            // Optional: debounce delay (default: 1000ms)
  maxAgeMs?: number;              // Optional: max data age (default: 24 hours)
  recordId?: string | null;       // Optional: specific record identifier
  enabled?: boolean;              // Optional: enable/disable auto-save (default: true)
  onSave?: () => void;           // Optional: callback after save
  onRestore?: (data: any) => void; // Optional: callback after restore
  onError?: (error: Error) => void; // Optional: error callback
}
```

### Return Values

#### AutoSaveState

```typescript
interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
  error: string | null;
}
```

#### AutoSaveActions

```typescript
interface AutoSaveActions {
  save: (data: any) => void;     // Manually trigger save
  restore: () => any | null;     // Manually restore data
  clear: () => void;             // Clear auto-save data
  forceStatus: (status) => void; // Force status change
}
```

## Examples

### Example 1: Simple Form with Auto-Save

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
    key: 'contact_form_autosave',
  });

  // Restore on mount
  useEffect(() => {
    const restored = autoSaveActions.restore();
    if (restored) {
      setFormData(restored);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitForm(formData);
      autoSaveActions.clear(); // Clear on success
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Auto-save indicator */}
      {autoSaveState.status === 'saving' && <span>Saving...</span>}
      {autoSaveState.status === 'saved' && <span>✓ Saved</span>}
      
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      {/* Rest of form fields */}
    </form>
  );
}
```

### Example 2: Edit Form with Record ID

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

interface Props {
  recordId?: string;
  initialData?: any;
}

export default function EditForm({ recordId, initialData }: Props) {
  const [formData, setFormData] = useState(initialData || {});

  const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
    key: 'edit_form_autosave',
    recordId: recordId || null,
    onRestore: (data) => {
      console.log('Restored data:', data);
      // Optionally show notification to user
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
      // Show error to user
    },
  });

  useEffect(() => {
    // Try to restore first
    const restored = autoSaveActions.restore();
    
    // If nothing restored and we have initial data, use it
    if (!restored && initialData) {
      setFormData(initialData);
    }
  }, [initialData, recordId]);

  return (
    <div>
      {/* Form content */}
    </div>
  );
}
```

### Example 3: Multi-Step Form

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    step1: { name: '', email: '' },
    step2: { address: '', city: '' },
    step3: { payment: '' },
  });

  const [autoSaveState, autoSaveActions] = useAutoSave(
    { ...formData, currentStep }, // Include current step
    {
      key: 'multistep_form_autosave',
      debounceMs: 1500, // Longer debounce for complex form
    }
  );

  useEffect(() => {
    const restored = autoSaveActions.restore();
    if (restored) {
      setFormData(restored);
      setCurrentStep(restored.currentStep || 1);
    }
  }, []);

  const nextStep = () => {
    autoSaveActions.save({ ...formData, currentStep: currentStep + 1 });
    setCurrentStep(currentStep + 1);
  };

  const previousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await submitForm(formData);
      autoSaveActions.clear();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {currentStep === 1 && <Step1 data={formData.step1} setData={(data) => setFormData({ ...formData, step1: data })} />}
      {currentStep === 2 && <Step2 data={formData.step2} setData={(data) => setFormData({ ...formData, step2: data })} />}
      {currentStep === 3 && <Step3 data={formData.step3} setData={(data) => setFormData({ ...formData, step3: data })} />}
      
      <div>
        {currentStep > 1 && <button onClick={previousStep}>Previous</button>}
        {currentStep < 3 && <button onClick={nextStep}>Next</button>}
        {currentStep === 3 && <button onClick={handleSubmit}>Submit</button>}
      </div>
      
      {autoSaveState.status === 'saved' && <span>Progress saved</span>}
    </div>
  );
}
```

### Example 4: Conditional Auto-Save

```typescript
'use client';

import { useState } from 'react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

export default function ConditionalForm() {
  const [formData, setFormData] = useState({ content: '', draft: true });
  
  // Only enable auto-save for drafts
  const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
    key: 'conditional_form_autosave',
    enabled: formData.draft, // Disable for published content
  });

  return (
    <form>
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
      />
      
      <label>
        <input
          type="checkbox"
          checked={formData.draft}
          onChange={(e) => setFormData({ ...formData, draft: e.target.checked })}
        />
        Save as draft
      </label>
      
      {formData.draft && autoSaveState.status === 'saved' && (
        <span>Draft auto-saved</span>
      )}
    </form>
  );
}
```

### Example 5: With Status Indicator Component

```typescript
'use client';

import { useAutoSave } from '@/lib/hooks/useAutoSave';

// Reusable status indicator component
function AutoSaveIndicator({ state }: { state: any }) {
  if (state.status === 'idle') return null;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {state.status === 'saving' && (
        <>
          <div className="animate-spin">⟳</div>
          <span>Saving...</span>
        </>
      )}
      {state.status === 'saved' && (
        <>
          <span className="text-green-500">✓</span>
          <span>Saved</span>
        </>
      )}
      {state.status === 'error' && (
        <>
          <span className="text-red-500">✗</span>
          <span>Error: {state.error}</span>
        </>
      )}
    </div>
  );
}

export default function MyForm() {
  const [formData, setFormData] = useState({ name: '' });
  const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
    key: 'my_form',
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>My Form</h2>
        <AutoSaveIndicator state={autoSaveState} />
      </div>
      {/* Form fields */}
    </div>
  );
}
```

## Advanced Usage

### Manual Save Trigger

```typescript
const [autoSaveState, autoSaveActions] = useAutoSave(formData, options);

// Manually trigger save (e.g., on blur)
const handleBlur = () => {
  autoSaveActions.save(formData);
};
```

### Custom Callbacks

```typescript
const [autoSaveState, autoSaveActions] = useAutoSave(formData, {
  key: 'my_form',
  onSave: () => {
    console.log('Data saved successfully');
    showNotification('Changes saved');
  },
  onRestore: (data) => {
    console.log('Data restored:', data);
    showNotification('Previous data restored');
  },
  onError: (error) => {
    console.error('Auto-save failed:', error);
    showNotification('Failed to save', 'error');
  },
});
```

### Force Status Change

```typescript
// Useful for testing or manual control
autoSaveActions.forceStatus('saved');
autoSaveActions.forceStatus('error');
```

### Clear on Cancel

```typescript
const handleCancel = () => {
  if (autoSaveState.hasUnsavedChanges) {
    const confirmed = confirm('Discard changes?');
    if (confirmed) {
      autoSaveActions.clear();
      onClose();
    }
  } else {
    onClose();
  }
};
```

## Best Practices

### 1. Unique Keys

Always use unique keys for different forms:

```typescript
// Good
useAutoSave(data, { key: 'contact_form_autosave' });
useAutoSave(data, { key: 'profile_form_autosave' });

// Bad - same key for different forms
useAutoSave(data, { key: 'form_autosave' });
```

### 2. Clear on Success

Always clear auto-save data after successful submission:

```typescript
const handleSubmit = async () => {
  await submitForm(formData);
  autoSaveActions.clear(); // Don't forget this!
};
```

### 3. Restore Early

Restore data as early as possible (in useEffect on mount):

```typescript
useEffect(() => {
  const restored = autoSaveActions.restore();
  if (restored) {
    setFormData(restored);
  }
}, []); // Empty deps = run once on mount
```

### 4. Handle Complex Objects

For complex data structures, ensure all parts are included:

```typescript
const dataToSave = {
  formData,
  additionalState,
  selectedItems,
  dateValues: dateValues.map(d => d.toISOString()),
};

const [autoSaveState, autoSaveActions] = useAutoSave(dataToSave, options);
```

### 5. Conditional Enabling

Use the `enabled` option to control when auto-save is active:

```typescript
useAutoSave(formData, {
  key: 'form',
  enabled: !isReadOnly && !isSubmitting,
});
```

## Troubleshooting

### Issue: Data Not Restoring

**Check:**
1. Is restore() being called in useEffect?
2. Does the recordId match?
3. Is data older than maxAgeMs?
4. Check browser console for errors

```typescript
useEffect(() => {
  console.log('Attempting restore...');
  const restored = autoSaveActions.restore();
  console.log('Restored data:', restored);
}, []);
```

### Issue: Too Frequent Saves

**Solution:** Increase debounce time:

```typescript
useAutoSave(data, {
  key: 'form',
  debounceMs: 2000, // Wait 2 seconds instead of 1
});
```

### Issue: Data Size Too Large

**Solution:** Reduce data or increase limit in utils:

```typescript
// In autoSaveUtils.ts
export const isDataSizeSafe = (data: any, maxSizeKB: number = 1000): boolean => {
  // Increased to 1MB
}
```

## Testing

### Unit Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save data', () => {
    const { result } = renderHook(() =>
      useAutoSave({ name: 'Test' }, { key: 'test' })
    );

    act(() => {
      result.current[1].save({ name: 'Test' });
    });

    expect(result.current[0].status).toBe('saved');
  });

  it('should restore data', () => {
    const { result } = renderHook(() =>
      useAutoSave({ name: 'Test' }, { key: 'test' })
    );

    act(() => {
      result.current[1].save({ name: 'Test' });
    });

    const restored = result.current[1].restore();
    expect(restored).toEqual({ name: 'Test' });
  });
});
```

## Performance Tips

1. **Memoize Complex Data**: Use `useMemo` for data transformations
2. **Increase Debounce**: For large forms, use longer debounce times
3. **Selective Auto-Save**: Only auto-save essential fields
4. **Monitor Size**: Use `getDataSize()` utility to check payload size

---

**Need Help?** Check the main [AUTO_SAVE_DOCUMENTATION.md](./AUTO_SAVE_DOCUMENTATION.md) for more details.
