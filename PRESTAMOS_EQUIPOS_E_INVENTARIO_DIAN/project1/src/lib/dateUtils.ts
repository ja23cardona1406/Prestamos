import { format, parseISO, add } from 'date-fns';

/**
 * Adjusts a date string to compensate for timezone-related offset issues.
 * When working with date inputs in forms, this ensures the correct date is stored.
 * 
 * @param dateString The date string to adjust (can be ISO format or yyyy-MM-dd)
 * @returns Formatted date string in yyyy-MM-dd format with adjustment
 */
export const adjustDateOffset = (dateString: string): string => {
  if (!dateString) return '';
  
  // Parse the date, adding a day to compensate for timezone issues
  const date = new Date(dateString);
  const adjustedDate = add(date, { days: 1 });
  
  return format(adjustedDate, 'yyyy-MM-dd');
};

/**
 * Formats a date for display, adding a day offset correction if needed
 * 
 * @param dateString The date string to format
 * @param formatStr The format string to use
 * @param addOffset Whether to add a day offset (default: false)
 * @returns Formatted date string
 */
export const formatDateWithOffset = (
  dateString: string, 
  formatStr: string = 'yyyy-MM-dd',
  addOffset: boolean = false
): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (addOffset) {
    return format(add(date, { days: 1 }), formatStr);
  }
  
  return format(date, formatStr);
};

/**
 * Safely creates a Date object from a string, compensating for timezone issues
 * 
 * @param dateString The date string to convert
 * @param addOffset Whether to add a day offset (default: false)
 * @returns Date object
 */
export const createSafeDate = (dateString: string, addOffset: boolean = false): Date => {
  const date = new Date(dateString);
  
  if (addOffset) {
    return add(date, { days: 1 });
  }
  
  return date;
};