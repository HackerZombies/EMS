// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines multiple class names into one string, intelligently merging and deduplicating Tailwind CSS classes.
 *
 * @param {...ClassValue[]} inputs - An array of class names or conditional class objects.
 * @returns {string} - The merged class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce utility to limit the rate at which a function can fire.
 *
 * @param {Func} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
export function debounce<Func extends (...args: any[]) => any>(
  func: Func,
  wait: number
): (...args: Parameters<Func>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;
  return (...args: Parameters<Func>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle utility to ensure a function is called at most once in a specified interval.
 *
 * @param {Func} func - The function to throttle.
 * @param {number} limit - The throttle interval in milliseconds.
 * @returns {Function} - The throttled function.
 */
export function throttle<Func extends (...args: any[]) => any>(
  func: Func,
  limit: number
): (...args: Parameters<Func>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<Func>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Formats a Date object into a specified string format.
 *
 * @param {Date | string} date - The date to format.
 * @param {string} dateFormat - The desired date format string.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date: Date | string, dateFormat: string): string {
  return format(new Date(date), dateFormat);
}
