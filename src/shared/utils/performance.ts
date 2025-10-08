import React from "react";

// Utility functions that were previously in various files
export * from "./responsive";
export * from "./errorHandling";

// Common utility functions
export const cn = (
  ...classes: (string | undefined | null | boolean)[]
) => {
  return classes.filter(Boolean).join(" ");
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
