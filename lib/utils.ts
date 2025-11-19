import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the start and end dates of the current month
export function getCurrentMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { startOfMonth, endOfMonth };
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format datetime for display
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Convert 24-hour format (HH:MM) to 12-hour format (HH:MM AM/PM)
export function convertTo12Hour(time24: string | null | undefined): string {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  if (!hours || !minutes) return time24;
  
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// Convert 12-hour format (HH:MM AM/PM) to 24-hour format (HH:MM)
export function convertTo24Hour(time12: string): string {
  if (!time12) return '';
  
  // Remove extra spaces and convert to uppercase
  const cleaned = time12.trim().toUpperCase();
  
  // Match pattern: HH:MM AM/PM
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) {
    // If it's already in 24-hour format, return as is
    if (cleaned.match(/^\d{2}:\d{2}$/)) {
      return cleaned;
    }
    return '';
  }
  
  let hour24 = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3];
  
  if (ampm === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}
