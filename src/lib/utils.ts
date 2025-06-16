import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with Tailwind's class merging
 * @param inputs Class names to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID with a prefix
 * @param prefix Prefix for the ID (e.g., 'SHO', 'DON')
 * @param donorName Optional donor name to use in donation IDs
 * @returns A unique ID string
 */
export function generateId(prefix: string, donorName?: string): string {
  // For donation IDs, follow the format DS-XXXX-YYYY where XXXX is the first 4 characters of donor name
  if (prefix === 'DON') {
    let nameChars = 'XXXX';
    
    // If donorName is provided, use the first 4 letters of it (padded with X if needed)
    if (donorName) {
      // Remove spaces, special characters, and normalize to uppercase
      const cleanName = donorName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      // Use the first 4 letters of the full name (not just first name)
      nameChars = cleanName.substring(0, 4).padEnd(4, 'X');
    } else {
      // If no name, use random characters
      nameChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    
    // Generate 4-digit random number
    const randomNums = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `DS-${nameChars}-${randomNums}`;
  }
  
  // For other IDs, use the timestamp-based format
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * Format a date string to local date string
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency value
 * @param amount Number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'No date';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return dateObj.toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * Generate a unique donation ID
 * Format: DON-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateDonationId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `DON-${year}${month}${day}-${random}`;
}

/**
 * Generate a unique request ID
 * Format: REQ-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateRequestId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `REQ-${year}${month}${day}-${random}`;
}

/**
 * Generate a unique money donation reference number
 * Format: DM-XXXX-YYYY where XXXX is the first 4 letters of donor's full name, 
 * and YYYY is a random 4-digit number
 * @param donorName Full name of the donor
 * @returns A unique money donation reference number
 */
export function generateMoneyDonationReferenceNumber(donorName: string): string {
  // Extract first 4 letters of donor name (uppercase and padded if needed)
  const namePrefix = donorName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 4)
    .padEnd(4, 'X');
  
  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000); // Range: 1000-9999
  
  // Create reference number in required format
  return `DM-${namePrefix}-${randomNum}`;
}
