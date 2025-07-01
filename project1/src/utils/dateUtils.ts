import { add, format } from 'date-fns';

// Utility function to handle date offset
export const adjustDateOffset = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Add one day to fix the offset issue
  return format(add(date, { days: 1 }), 'yyyy-MM-dd');
};

// Utility function to format display dates with offset
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Add one day for display
  return format(add(date, { days: 1 }), 'dd/MM/yyyy');
};