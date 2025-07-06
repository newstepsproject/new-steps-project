import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ReferenceIdGenerators } from './reference-id-generator';

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
 * @deprecated Use ReferenceIdGenerators from reference-id-generator.ts instead
 * @param prefix Prefix for the ID (e.g., 'SHO', 'DON')
 * @param donorName Optional donor name to use in donation IDs
 * @returns A unique ID string
 */
export function generateId(prefix: string, donorName?: string): string {
  console.warn('generateId is deprecated. Use ReferenceIdGenerators instead.');
  
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
 * Generate a unique donation ID
 * @deprecated Use ReferenceIdGenerators.donation() instead
 * Format: DON-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateDonationId(): string {
  console.warn('generateDonationId is deprecated. Use ReferenceIdGenerators.donation() instead.');
  return ReferenceIdGenerators.donation();
}

/**
 * Generate a unique request ID
 * @deprecated Use ReferenceIdGenerators.shoeRequest() instead
 * Format: REQ-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateRequestId(): string {
  console.warn('generateRequestId is deprecated. Use ReferenceIdGenerators.shoeRequest() instead.');
  return ReferenceIdGenerators.shoeRequest();
}

/**
 * Generate a unique money donation reference number
 * @deprecated Use ReferenceIdGenerators.moneyDonation(donorName) instead
 * Format: DM-XXXX-YYYY where XXXX is the first 4 letters of donor's full name, 
 * and YYYY is a random 4-digit number
 * @param donorName Full name of the donor
 * @returns A unique money donation reference number
 */
export function generateMoneyDonationReferenceNumber(donorName: string): string {
  console.warn('generateMoneyDonationReferenceNumber is deprecated. Use ReferenceIdGenerators.moneyDonation(donorName) instead.');
  return ReferenceIdGenerators.moneyDonation(donorName);
}

// New unified functions using the reference ID generator
/**
 * Generate a unique order ID
 * Format: ORD-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateOrderId(): string {
  return ReferenceIdGenerators.order();
}

/**
 * Generate a unique volunteer ID
 * Format: VOL-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateVolunteerId(): string {
  return ReferenceIdGenerators.volunteer();
}

/**
 * Generate a unique partnership inquiry ID
 * Format: PAR-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generatePartnershipId(): string {
  return ReferenceIdGenerators.partnership();
}

/**
 * Generate a unique contact form ID
 * Format: CON-YYYYMMDD-XXXX where XXXX is a random 4-character string
 */
export function generateContactId(): string {
  return ReferenceIdGenerators.contact();
}

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a date to a short string
 * @param date Date to format
 * @returns Short formatted date string
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format currency to USD
 * @param amount Amount in dollars
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Truncate text to a specified length
 * @param text Text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Generate a slug from a string
 * @param text Text to convert to slug
 * @returns Slug string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Check if a string is a valid email
 * @param email Email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if a string is a valid phone number
 * @param phone Phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Capitalize first letter of each word
 * @param text Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Get initials from a name
 * @param name Full name
 * @returns Initials
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Calculate age from birth date
 * @param birthDate Birth date
 * @returns Age in years
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return formatDateShort(date)
  }
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * Debounce a function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle a function
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
