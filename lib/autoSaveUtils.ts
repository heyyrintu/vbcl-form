/**
 * Auto-save Utilities
 * Provides secure and efficient auto-save functionality for forms
 */

export interface AutoSaveData {
  [key: string]: any;
  sessionId: string;
  timestamp: number;
  recordId?: string | null;
}

/**
 * Validates that the data being saved/restored meets security requirements
 */
export const validateAutoSaveData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (!data.sessionId || !data.timestamp) return false;
  
  // Check if timestamp is valid (not in future, not too old)
  const now = Date.now();
  if (data.timestamp > now || data.timestamp < now - 30 * 24 * 60 * 60 * 1000) {
    return false;
  }
  
  return true;
};

/**
 * Safely parse JSON from localStorage with error handling
 */
export const safeParseJSON = (jsonString: string | null): any | null => {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
};

/**
 * Safely stringify data for localStorage with error handling
 */
export const safeStringifyJSON = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify JSON:', error);
    return null;
  }
};

/**
 * Check if localStorage is available and functional
 */
export const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return false;
  }
};

/**
 * Calculate data age in human-readable format
 */
export const getDataAge = (timestamp: number): string => {
  const ageMs = Date.now() - timestamp;
  const ageMinutes = Math.floor(ageMs / (60 * 1000));
  const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  
  if (ageDays > 0) return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
  if (ageHours > 0) return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  if (ageMinutes > 0) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  return 'just now';
};

/**
 * Sanitize form data to prevent XSS attacks
 */
export const sanitizeFormData = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potential script tags and dangerous characters
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeFormData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeFormData(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Calculate the size of data in bytes
 */
export const getDataSize = (data: any): number => {
  const str = safeStringifyJSON(data);
  if (!str) return 0;
  return new Blob([str]).size;
};

/**
 * Check if data size is within safe limits for localStorage (typically 5-10MB)
 */
export const isDataSizeSafe = (data: any, maxSizeKB: number = 500): boolean => {
  const sizeBytes = getDataSize(data);
  const sizeKB = sizeBytes / 1024;
  return sizeKB <= maxSizeKB;
};

/**
 * Create a throttled version of a function
 */
export const throttle = (func: Function, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
};

/**
 * Create a debounced version of a function
 */
export const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Get browser info for debugging purposes
 */
export const getBrowserInfo = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  return navigator.userAgent;
};

/**
 * Check if browser supports the features needed for auto-save
 */
export const checkBrowserCompatibility = (): { 
  compatible: boolean; 
  features: {
    localStorage: boolean;
    sessionStorage: boolean;
    beforeUnload: boolean;
  }
} => {
  if (typeof window === 'undefined') {
    return {
      compatible: false,
      features: {
        localStorage: false,
        sessionStorage: false,
        beforeUnload: false,
      }
    };
  }
  
  const features = {
    localStorage: isLocalStorageAvailable(),
    sessionStorage: !!window.sessionStorage,
    beforeUnload: 'onbeforeunload' in window,
  };
  
  return {
    compatible: features.localStorage && features.sessionStorage,
    features,
  };
};

/**
 * Clear all auto-save data (useful for maintenance)
 */
export const clearAllAutoSaveData = (prefix: string = 'record_form'): void => {
  if (!isLocalStorageAvailable()) return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Get all auto-save entries (useful for debugging)
 */
export const getAllAutoSaveEntries = (prefix: string = 'record_form'): Record<string, any> => {
  if (!isLocalStorageAvailable()) return {};
  
  const entries: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const data = safeParseJSON(localStorage.getItem(key));
      if (data) {
        entries[key] = data;
      }
    }
  }
  
  return entries;
};
