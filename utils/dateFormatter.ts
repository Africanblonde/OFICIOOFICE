/**
 * Safely format a flexible date value that may come from DB fields with various names/types.
 * Tolerates: string (ISO), number (timestamp), object with timestamp-like keys, or null/undefined.
 * Returns a formatted string or a fallback message.
 */
export function formatFlexibleDate(
  value: any,
  options?: { dateOnly?: boolean; time?: boolean; fallback?: string }
): string {
  const { dateOnly = false, time = false, fallback = '—' } = options || {};

  // If value is nullish, return fallback
  if (value === null || value === undefined) {
    return fallback;
  }

  let dateObj: Date | null = null;

  // Case 1: value is already a Date
  if (value instanceof Date) {
    dateObj = value;
  }
  // Case 2: value is a string (ISO date, timestamp string, etc.)
  else if (typeof value === 'string' && value.trim()) {
    dateObj = new Date(value);
  }
  // Case 3: value is a number (Unix timestamp in ms or seconds)
  else if (typeof value === 'number') {
    dateObj = new Date(value);
  }
  // Case 4: value is an object; try to find a timestamp-like field
  else if (typeof value === 'object') {
    // Try common field names in order of preference
    const keys = ['timestamp', 'created_at', 'createdAt', 'date', 'updated_at', 'updatedAt'];
    for (const key of keys) {
      if (key in value && value[key]) {
        dateObj = new Date(value[key]);
        if (!isNaN(dateObj.getTime())) {
          break;
        }
      }
    }
  }

  // Check if we have a valid date
  if (!dateObj || isNaN(dateObj.getTime())) {
    return fallback;
  }

  // Format based on options
  try {
    if (dateOnly) {
      return dateObj.toLocaleDateString('pt-MZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } else if (time) {
      return dateObj.toLocaleString('pt-MZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } else {
      return dateObj.toLocaleString('pt-MZ');
    }
  } catch {
    return fallback;
  }
}
