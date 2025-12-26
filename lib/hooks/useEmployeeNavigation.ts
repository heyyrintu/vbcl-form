/**
 * useEmployeeNavigation Hook
 * Reusable hook for navigating to employee profiles with state preservation
 */

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface EmployeeNavigationOptions {
  returnDate?: string;
  returnShift?: string;
  fromPage?: string;
  onError?: (error: string) => void;
  onNavigate?: (employeeId: string) => void;
}

export interface EmployeeNavigationState {
  navigatingTo: string | null;
  error: string | null;
  isNavigating: boolean;
}

export interface EmployeeNavigationActions {
  navigateToEmployee: (employeeId: string, employeeName: string) => Promise<void>;
  navigateBack: () => void;
  clearError: () => void;
}

export const useEmployeeNavigation = (
  options: EmployeeNavigationOptions = {}
): [EmployeeNavigationState, EmployeeNavigationActions] => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<EmployeeNavigationState>({
    navigatingTo: null,
    error: null,
    isNavigating: false,
  });

  const {
    returnDate,
    returnShift,
    fromPage = 'attendance',
    onError,
    onNavigate,
  } = options;

  /**
   * Navigate to employee profile with verification
   */
  const navigateToEmployee = useCallback(
    async (employeeId: string, employeeName: string) => {
      // Clear previous errors
      setState((prev) => ({
        ...prev,
        error: null,
        navigatingTo: employeeId,
        isNavigating: true,
      }));

      try {
        // Verify employee exists before navigating
        const response = await fetch(`/api/employees/${employeeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            const errorMsg = `Employee profile not found: ${employeeName}`;
            setState({
              navigatingTo: null,
              error: errorMsg,
              isNavigating: false,
            });
            onError?.(errorMsg);
            return;
          }
          throw new Error('Failed to verify employee');
        }

        // Build URL with query parameters
        const params = new URLSearchParams();
        if (returnDate) params.set('returnDate', returnDate);
        if (returnShift) params.set('returnShift', returnShift);
        if (fromPage) params.set('from', fromPage);

        const url = `/employees/${employeeId}?${params.toString()}`;

        // Notify about navigation
        onNavigate?.(employeeId);

        // Navigate
        router.push(url);
      } catch (error) {
        console.error('Employee navigation error:', error);
        const errorMsg = 'Failed to navigate to employee profile. Please try again.';
        setState({
          navigatingTo: null,
          error: errorMsg,
          isNavigating: false,
        });
        onError?.(errorMsg);
      }
    },
    [returnDate, returnShift, fromPage, router, onError, onNavigate]
  );

  /**
   * Navigate back to source page
   */
  const navigateBack = useCallback(() => {
    const params = new URLSearchParams();

    // Check if we have return parameters in current URL
    const urlReturnDate = searchParams.get('returnDate');
    const urlReturnShift = searchParams.get('returnShift');
    const urlFromPage = searchParams.get('from');

    if (urlReturnDate) params.set('date', urlReturnDate);
    if (urlReturnShift) params.set('shift', urlReturnShift);

    // Determine destination based on fromPage
    let destination = '/employees';
    if (urlFromPage === 'attendance' || fromPage === 'attendance') {
      destination = '/employee-attendance';
    }

    const url = `${destination}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [searchParams, fromPage, router]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const actions: EmployeeNavigationActions = {
    navigateToEmployee,
    navigateBack,
    clearError,
  };

  return [state, actions];
};

/**
 * Hook to get return navigation info from URL parameters
 */
export const useReturnNavigation = () => {
  const searchParams = useSearchParams();

  return {
    returnDate: searchParams.get('returnDate'),
    returnShift: searchParams.get('returnShift'),
    fromPage: searchParams.get('from'),
    hasReturnInfo: searchParams.has('from'),
  };
};
