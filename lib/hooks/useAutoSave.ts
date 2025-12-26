/**
 * useAutoSave Hook
 * Reusable React hook for implementing auto-save functionality in forms
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  validateAutoSaveData,
  safeParseJSON,
  safeStringifyJSON,
  isLocalStorageAvailable,
  sanitizeFormData,
  isDataSizeSafe,
} from '../autoSaveUtils';

export interface AutoSaveOptions {
  key: string;
  debounceMs?: number;
  maxAgeMs?: number;
  recordId?: string | null;
  enabled?: boolean;
  onSave?: () => void;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
  error: string | null;
}

export interface AutoSaveActions {
  save: (data: any) => void;
  restore: () => any | null;
  clear: () => void;
  forceStatus: (status: AutoSaveState['status']) => void;
}

const SESSION_ID_KEY = 'autosave_session_id';

const generateSessionId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export const useAutoSave = (
  data: any,
  options: AutoSaveOptions
): [AutoSaveState, AutoSaveActions] => {
  const {
    key,
    debounceMs = 1000,
    maxAgeMs = 24 * 60 * 60 * 1000, // 24 hours default
    recordId = null,
    enabled = true,
    onSave,
    onRestore,
    onError,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    hasUnsavedChanges: false,
    lastSaved: null,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);
  const hasRestoredRef = useRef(false);

  // Initialize session ID
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Save function
  const save = useCallback(
    (dataToSave: any) => {
      if (!enabled || !isLocalStorageAvailable()) return;

      try {
        // Sanitize data before saving
        const sanitizedData = sanitizeFormData(dataToSave);

        const payload = {
          data: sanitizedData,
          sessionId: sessionIdRef.current,
          timestamp: Date.now(),
          recordId,
        };

        // Check data size
        if (!isDataSizeSafe(payload)) {
          throw new Error('Data size exceeds safe limit for localStorage');
        }

        const serialized = safeStringifyJSON(payload);
        if (!serialized) {
          throw new Error('Failed to serialize data');
        }

        localStorage.setItem(key, serialized);

        setState((prev) => ({
          ...prev,
          status: 'saved',
          hasUnsavedChanges: false,
          lastSaved: Date.now(),
          error: null,
        }));

        onSave?.();

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            status: 'idle',
          }));
        }, 2000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to auto-save';
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [key, recordId, enabled, onSave, onError]
  );

  // Restore function
  const restore = useCallback((): any | null => {
    if (!isLocalStorageAvailable() || hasRestoredRef.current) return null;

    try {
      const stored = localStorage.getItem(key);
      const parsed = safeParseJSON(stored);

      if (!parsed || !validateAutoSaveData(parsed)) return null;

      // Check if data matches current record
      const isSameRecord = parsed.recordId === recordId;
      if (!isSameRecord) return null;

      // Check data age
      const dataAge = Date.now() - parsed.timestamp;
      if (dataAge > maxAgeMs) {
        localStorage.removeItem(key);
        return null;
      }

      hasRestoredRef.current = true;
      setState((prev) => ({
        ...prev,
        hasUnsavedChanges: true,
        lastSaved: parsed.timestamp,
      }));

      onRestore?.(parsed.data);
      return parsed.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore data';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      localStorage.removeItem(key);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [key, recordId, maxAgeMs, onRestore, onError]);

  // Clear function
  const clear = useCallback(() => {
    if (!isLocalStorageAvailable()) return;

    localStorage.removeItem(key);
    setState({
      status: 'idle',
      hasUnsavedChanges: false,
      lastSaved: null,
      error: null,
    });
    hasRestoredRef.current = false;
  }, [key]);

  // Force status (useful for manual control)
  const forceStatus = useCallback((status: AutoSaveState['status']) => {
    setState((prev) => ({
      ...prev,
      status,
    }));
  }, []);

  // Auto-save effect
  useEffect(() => {
    // Skip during initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (!enabled) return;

    // Mark as having unsaved changes
    setState((prev) => ({
      ...prev,
      status: 'saving',
      hasUnsavedChanges: true,
    }));

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      save(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs, enabled]);

  // Warn before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  const actions: AutoSaveActions = {
    save,
    restore,
    clear,
    forceStatus,
  };

  return [state, actions];
};
