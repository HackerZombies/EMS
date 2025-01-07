// src/utils/timezone.ts

import { format, toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a Date object to IST timezone in 'yyyy-MM-dd HH:mm:ssXXX' format.
 * @param date - The Date object to format.
 * @returns Formatted date string in IST.
 */
export function formatToIST(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Convert to IST (UTC+5:30)
  const utcOffsetMinutes = 330; // IST is UTC+5:30
  const istDate = new Date(dateObj.getTime() + utcOffsetMinutes * 60 * 1000);

  // Format the date (e.g., DD-MM-YYYY HH:mm:ss)
  return istDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

