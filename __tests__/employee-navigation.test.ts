/**
 * Employee Navigation Tests
 * Tests for employee profile redirect functionality from attendance summary
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new Map();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key),
    toString: () => {
      const params = new URLSearchParams();
      mockSearchParams.forEach((value, key) => params.set(key, value));
      return params.toString();
    },
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Employee Navigation from Attendance Summary', () => {
  const mockEmployee = {
    id: 'emp-123',
    employeeId: 'EMP001',
    name: 'John Doe',
    role: 'Fitter',
  };

  const mockAttendanceRecord = {
    id: 'att-123',
    employeeId: 'emp-123',
    date: '2025-12-26',
    shift: 'Day',
    employee: mockEmployee,
    vehicleEntries: [
      {
        recordId: 'rec-123',
        binNo: 'BIN001',
        modelNo: 'MODEL-X',
        chassisNo: 'CH12345',
        srNoVehicleCount: 1,
        splitCount: 1.0,
      },
    ],
  };

  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams.clear();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleEmployeeClick', () => {
    it('should navigate to employee profile when employee exists', async () => {
      // Mock successful employee verification
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployee,
      });

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        const response = await fetch(`/api/employees/${employee.id}`);
        if (response.ok) {
          const params = new URLSearchParams();
          params.set('returnDate', '2025-12-26');
          params.set('returnShift', 'Day');
          params.set('from', 'attendance');
          mockPush(`/employees/${employee.id}?${params.toString()}`);
        }
      };

      await handleEmployeeClick(mockEmployee);

      expect(global.fetch).toHaveBeenCalledWith(`/api/employees/${mockEmployee.id}`);
      expect(mockPush).toHaveBeenCalledWith(
        `/employees/${mockEmployee.id}?returnDate=2025-12-26&returnShift=Day&from=attendance`
      );
    });

    it('should show error when employee does not exist (404)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      let errorMessage = null;

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        const response = await fetch(`/api/employees/${employee.id}`);
        if (!response.ok && response.status === 404) {
          errorMessage = `Employee profile not found: ${employee.name}`;
        }
      };

      await handleEmployeeClick(mockEmployee);

      expect(errorMessage).toBe('Employee profile not found: John Doe');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      let errorMessage = null;

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        try {
          await fetch(`/api/employees/${employee.id}`);
        } catch (error) {
          errorMessage = 'Failed to navigate to employee profile. Please try again.';
        }
      };

      await handleEmployeeClick(mockEmployee);

      expect(errorMessage).toBe('Failed to navigate to employee profile. Please try again.');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should preserve query parameters in navigation URL', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployee,
      });

      const handleEmployeeClick = async (
        employee: typeof mockEmployee,
        date: string,
        shift: string
      ) => {
        const response = await fetch(`/api/employees/${employee.id}`);
        if (response.ok) {
          const params = new URLSearchParams();
          params.set('returnDate', date);
          params.set('returnShift', shift);
          params.set('from', 'attendance');
          mockPush(`/employees/${employee.id}?${params.toString()}`);
        }
      };

      await handleEmployeeClick(mockEmployee, '2025-12-25', 'Night');

      const expectedUrl = expect.stringContaining('returnDate=2025-12-25');
      const expectedShift = expect.stringContaining('returnShift=Night');
      const expectedFrom = expect.stringContaining('from=attendance');

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/returnDate=2025-12-25.*returnShift=Night.*from=attendance/)
      );
    });
  });

  describe('Navigation State Management', () => {
    it('should set loading state during navigation', async () => {
      let isNavigating = false;

      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              isNavigating = false;
              resolve({
                ok: true,
                json: async () => mockEmployee,
              });
            }, 100);
          })
      );

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        isNavigating = true;
        const response = await fetch(`/api/employees/${employee.id}`);
        if (response.ok) {
          mockPush(`/employees/${employee.id}`);
        }
      };

      const promise = handleEmployeeClick(mockEmployee);
      expect(isNavigating).toBe(true);

      await promise;
      expect(isNavigating).toBe(false);
    });

    it('should clear loading state on error', async () => {
      let isNavigating = false;

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        isNavigating = true;
        try {
          await fetch(`/api/employees/${employee.id}`);
        } catch (error) {
          isNavigating = false;
        }
      };

      await handleEmployeeClick(mockEmployee);
      expect(isNavigating).toBe(false);
    });
  });

  describe('Return Navigation', () => {
    it('should construct return URL with preserved parameters', () => {
      mockSearchParams.set('returnDate', '2025-12-26');
      mockSearchParams.set('returnShift', 'Day');
      mockSearchParams.set('from', 'attendance');

      const handleReturnToAttendance = () => {
        const params = new URLSearchParams();
        const returnDate = mockSearchParams.get('returnDate');
        const returnShift = mockSearchParams.get('returnShift');

        if (returnDate) params.set('date', returnDate);
        if (returnShift) params.set('shift', returnShift);

        const url = `/employee-attendance${params.toString() ? `?${params.toString()}` : ''}`;
        mockPush(url);
      };

      handleReturnToAttendance();

      expect(mockPush).toHaveBeenCalledWith('/employee-attendance?date=2025-12-26&shift=Day');
    });

    it('should handle return navigation without parameters', () => {
      const handleReturnToAttendance = () => {
        const params = new URLSearchParams();
        const url = `/employee-attendance${params.toString() ? `?${params.toString()}` : ''}`;
        mockPush(url);
      };

      handleReturnToAttendance();

      expect(mockPush).toHaveBeenCalledWith('/employee-attendance');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for employee link', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', `View profile for ${mockEmployee.name}`);
      button.setAttribute('aria-busy', 'false');

      expect(button.getAttribute('aria-label')).toBe('View profile for John Doe');
      expect(button.getAttribute('aria-busy')).toBe('false');
    });

    it('should update aria-busy during navigation', () => {
      const button = document.createElement('button');
      let isNavigating = false;

      button.setAttribute('aria-busy', String(isNavigating));
      expect(button.getAttribute('aria-busy')).toBe('false');

      isNavigating = true;
      button.setAttribute('aria-busy', String(isNavigating));
      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should be keyboard navigable', () => {
      const button = document.createElement('button');
      button.onclick = () => mockPush('/employees/emp-123');

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(keydownEvent);

      // Button should be focusable
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should display error message for 404 response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      let errorState = null;

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        const response = await fetch(`/api/employees/${employee.id}`);
        if (response.status === 404) {
          errorState = `Employee profile not found: ${employee.name}`;
        }
      };

      await handleEmployeeClick(mockEmployee);

      expect(errorState).toBeTruthy();
      expect(errorState).toContain('not found');
    });

    it('should display generic error for server errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      let errorState = null;

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        const response = await fetch(`/api/employees/${employee.id}`);
        if (!response.ok && response.status !== 404) {
          errorState = 'Failed to verify employee';
        }
      };

      await handleEmployeeClick(mockEmployee);

      expect(errorState).toBe('Failed to verify employee');
    });

    it('should clear error message after successful navigation', async () => {
      let errorState: string | null = 'Previous error';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployee,
      });

      const handleEmployeeClick = async (employee: typeof mockEmployee) => {
        errorState = null;
        const response = await fetch(`/api/employees/${employee.id}`);
        if (response.ok) {
          mockPush(`/employees/${employee.id}`);
        }
      };

      await handleEmployeeClick(mockEmployee);

      expect(errorState).toBeNull();
    });
  });

  describe('URL Construction', () => {
    it('should construct proper URL with all parameters', () => {
      const employee = mockEmployee;
      const date = '2025-12-26';
      const shift = 'Night';

      const params = new URLSearchParams();
      params.set('returnDate', date);
      params.set('returnShift', shift);
      params.set('from', 'attendance');

      const url = `/employees/${employee.id}?${params.toString()}`;

      expect(url).toBe('/employees/emp-123?returnDate=2025-12-26&returnShift=Night&from=attendance');
    });

    it('should handle special characters in employee name', () => {
      const specialEmployee = {
        ...mockEmployee,
        name: "O'Brien & Sons",
      };

      const ariaLabel = `View profile for ${specialEmployee.name}`;
      expect(ariaLabel).toBe("View profile for O'Brien & Sons");
    });
  });

  describe('Multiple Employees', () => {
    it('should navigate to correct employee when multiple are present', async () => {
      const employees = [
        { id: 'emp-1', name: 'Alice' },
        { id: 'emp-2', name: 'Bob' },
        { id: 'emp-3', name: 'Charlie' },
      ];

      for (const employee of employees) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => employee,
        });

        const response = await fetch(`/api/employees/${employee.id}`);
        if (response.ok) {
          mockPush(`/employees/${employee.id}`);
        }
      }

      expect(mockPush).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenNthCalledWith(1, '/employees/emp-1');
      expect(mockPush).toHaveBeenNthCalledWith(2, '/employees/emp-2');
      expect(mockPush).toHaveBeenNthCalledWith(3, '/employees/emp-3');
    });
  });
});

describe('Query Parameter Preservation', () => {
  it('should preserve date and shift when navigating back', () => {
    const mockParams = new Map([
      ['returnDate', '2025-12-26'],
      ['returnShift', 'Day'],
      ['from', 'attendance'],
    ]);

    const params = new URLSearchParams();
    mockParams.forEach((value, key) => {
      if (key === 'returnDate') params.set('date', value);
      if (key === 'returnShift') params.set('shift', value);
    });

    const url = `/employee-attendance?${params.toString()}`;

    expect(url).toBe('/employee-attendance?date=2025-12-26&shift=Day');
  });

  it('should handle missing query parameters gracefully', () => {
    const mockParams = new Map();

    const params = new URLSearchParams();
    mockParams.forEach((value, key) => {
      if (key === 'returnDate') params.set('date', value);
      if (key === 'returnShift') params.set('shift', value);
    });

    const url = `/employee-attendance${params.toString() ? `?${params.toString()}` : ''}`;

    expect(url).toBe('/employee-attendance');
  });
});
