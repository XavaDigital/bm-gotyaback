/**
 * Format a date string or Date object to a readable format
 * @param date - The date to format
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | undefined,
  includeTime = false
): string => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-NZ', options).format(dateObj);
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to compare
 * @returns Relative time string
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (Math.abs(diffDay) > 0) {
    return diffDay > 0 ? `in ${diffDay} day${diffDay > 1 ? 's' : ''}` : `${Math.abs(diffDay)} day${Math.abs(diffDay) > 1 ? 's' : ''} ago`;
  }
  if (Math.abs(diffHour) > 0) {
    return diffHour > 0 ? `in ${diffHour} hour${diffHour > 1 ? 's' : ''}` : `${Math.abs(diffHour)} hour${Math.abs(diffHour) > 1 ? 's' : ''} ago`;
  }
  if (Math.abs(diffMin) > 0) {
    return diffMin > 0 ? `in ${diffMin} minute${diffMin > 1 ? 's' : ''}` : `${Math.abs(diffMin)} minute${Math.abs(diffMin) > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

/**
 * Check if a date is in the past
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export const isPast = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
};

/**
 * Check if a date is in the future
 * @param date - The date to check
 * @returns True if the date is in the future
 */
export const isFuture = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
};

