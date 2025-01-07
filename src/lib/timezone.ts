import { format, toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a Date object or ISO string to IST timezone in 'yyyy-MM-dd HH:mm:ssXXX' format.
 * @param date - The Date object or ISO string to format.
 * @returns Formatted date string in IST timezone.
 */
export function formatToIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Convert the date to IST timezone
  const zonedDate = toZonedTime(dateObj, IST_TIMEZONE);

  // Format the date to 'yyyy-MM-dd HH:mm:ssXXX'
  return format(zonedDate, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: IST_TIMEZONE });
}
