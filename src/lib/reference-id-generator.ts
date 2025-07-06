/**
 * Unified Reference ID Generation System
 * 
 * This module provides consistent reference ID generation across all entities
 * in the New Steps Project platform, ensuring traceability and professional appearance.
 */

export enum EntityType {
  DONATION = 'donation',
  MONEY_DONATION = 'money_donation',
  SHOE_REQUEST = 'shoe_request',
  ORDER = 'order',
  VOLUNTEER = 'volunteer',
  PARTNERSHIP = 'partnership',
  CONTACT = 'contact'
}

export interface ReferenceIdConfig {
  prefix: string;
  format: 'date-based' | 'sequential' | 'name-based';
  length: number;
  includeChecksum: boolean;
  description: string;
}

/**
 * Configuration for each entity type's reference ID format
 */
export const REFERENCE_ID_CONFIGS: Record<EntityType, ReferenceIdConfig> = {
  [EntityType.DONATION]: {
    prefix: 'DON',
    format: 'date-based',
    length: 4,
    includeChecksum: false,
    description: 'Shoe donation reference ID'
  },
  [EntityType.MONEY_DONATION]: {
    prefix: 'DM',
    format: 'name-based',
    length: 4,
    includeChecksum: false,
    description: 'Money donation reference ID'
  },
  [EntityType.SHOE_REQUEST]: {
    prefix: 'REQ',
    format: 'date-based',
    length: 4,
    includeChecksum: false,
    description: 'Shoe request reference ID'
  },
  [EntityType.ORDER]: {
    prefix: 'ORD',
    format: 'date-based',
    length: 4,
    includeChecksum: false,
    description: 'Order reference ID'
  },
  [EntityType.VOLUNTEER]: {
    prefix: 'VOL',
    format: 'date-based',
    length: 4,
    includeChecksum: false,
    description: 'Volunteer application reference ID'
  },
  [EntityType.PARTNERSHIP]: {
    prefix: 'PAR',
    format: 'date-based',
    length: 4,
    includeChecksum: false,
    description: 'Partnership inquiry reference ID'
  },
  [EntityType.CONTACT]: {
    prefix: 'CON',
    format: 'date-based',
    length: 4,
    includeChecksum: false,
    description: 'Contact form reference ID'
  }
};

/**
 * Generate a reference ID for a specific entity type
 */
export function generateReferenceId(
  entityType: EntityType,
  options?: {
    name?: string;
    sequenceNumber?: number;
    customSuffix?: string;
  }
): string {
  const config = REFERENCE_ID_CONFIGS[entityType];
  
  if (!config) {
    throw new Error(`No configuration found for entity type: ${entityType}`);
  }
  
  const { prefix, format, length } = config;
  const { name, sequenceNumber, customSuffix } = options || {};
  
  switch (format) {
    case 'date-based':
      return generateDateBasedId(prefix, length, customSuffix);
    
    case 'name-based':
      if (!name) {
        throw new Error(`Name is required for name-based reference ID generation`);
      }
      return generateNameBasedId(prefix, name, length);
    
    case 'sequential':
      if (sequenceNumber === undefined) {
        throw new Error(`Sequence number is required for sequential reference ID generation`);
      }
      return generateSequentialId(prefix, sequenceNumber, length);
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate a date-based reference ID
 * Format: PREFIX-YYYYMMDD-XXXX
 */
function generateDateBasedId(prefix: string, length: number, customSuffix?: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const suffix = customSuffix || generateRandomString(length);
  
  return `${prefix}-${year}${month}${day}-${suffix}`;
}

/**
 * Generate a name-based reference ID
 * Format: PREFIX-XXXX-YYYY (where XXXX is from name, YYYY is random)
 */
function generateNameBasedId(prefix: string, name: string, length: number): string {
  // Extract first 4 letters of name (uppercase and padded if needed)
  const namePrefix = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 4)
    .padEnd(4, 'X');
  
  // Generate random suffix
  const randomSuffix = generateRandomNumber(length);
  
  return `${prefix}-${namePrefix}-${randomSuffix}`;
}

/**
 * Generate a sequential reference ID
 * Format: PREFIX-NNNNNN (where N is sequence number)
 */
function generateSequentialId(prefix: string, sequenceNumber: number, length: number): string {
  const paddedNumber = String(sequenceNumber).padStart(length, '0');
  return `${prefix}-${paddedNumber}`;
}

/**
 * Generate a random string of specified length
 */
function generateRandomString(length: number): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

/**
 * Generate a random number of specified length
 */
function generateRandomNumber(length: number): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Validate a reference ID format
 */
export function validateReferenceId(referenceId: string, entityType: EntityType): boolean {
  const config = REFERENCE_ID_CONFIGS[entityType];
  
  if (!config) {
    return false;
  }
  
  const { prefix, format } = config;
  
  // Check if it starts with the correct prefix
  if (!referenceId.startsWith(prefix + '-')) {
    return false;
  }
  
  const parts = referenceId.split('-');
  
  switch (format) {
    case 'date-based':
      // Format: PREFIX-YYYYMMDD-XXXX
      if (parts.length !== 3) return false;
      if (parts[0] !== prefix) return false;
      if (!/^\d{8}$/.test(parts[1])) return false; // YYYYMMDD
      if (!/^[A-Z0-9]{4}$/.test(parts[2])) return false; // 4 chars
      return true;
    
    case 'name-based':
      // Format: PREFIX-XXXX-YYYY
      if (parts.length !== 3) return false;
      if (parts[0] !== prefix) return false;
      if (!/^[A-Z]{4}$/.test(parts[1])) return false; // 4 letters
      if (!/^\d{4}$/.test(parts[2])) return false; // 4 digits
      return true;
    
    case 'sequential':
      // Format: PREFIX-NNNNNN
      if (parts.length !== 2) return false;
      if (parts[0] !== prefix) return false;
      if (!/^\d+$/.test(parts[1])) return false; // All digits
      return true;
    
    default:
      return false;
  }
}

/**
 * Extract information from a reference ID
 */
export function parseReferenceId(referenceId: string): {
  entityType: EntityType | null;
  prefix: string;
  date?: string;
  namePrefix?: string;
  sequenceNumber?: number;
  randomSuffix?: string;
  isValid: boolean;
} {
  const parts = referenceId.split('-');
  
  if (parts.length < 2) {
    return {
      entityType: null,
      prefix: '',
      isValid: false
    };
  }
  
  const prefix = parts[0];
  const entityType = getEntityTypeFromPrefix(prefix);
  
  if (!entityType) {
    return {
      entityType: null,
      prefix,
      isValid: false
    };
  }
  
  const config = REFERENCE_ID_CONFIGS[entityType];
  const isValid = validateReferenceId(referenceId, entityType);
  
  const result = {
    entityType,
    prefix,
    isValid
  };
  
  if (!isValid) {
    return result;
  }
  
  switch (config.format) {
    case 'date-based':
      return {
        ...result,
        date: parts[1],
        randomSuffix: parts[2]
      };
    
    case 'name-based':
      return {
        ...result,
        namePrefix: parts[1],
        randomSuffix: parts[2]
      };
    
    case 'sequential':
      return {
        ...result,
        sequenceNumber: parseInt(parts[1], 10)
      };
    
    default:
      return result;
  }
}

/**
 * Get entity type from prefix
 */
function getEntityTypeFromPrefix(prefix: string): EntityType | null {
  for (const [entityType, config] of Object.entries(REFERENCE_ID_CONFIGS)) {
    if (config.prefix === prefix) {
      return entityType as EntityType;
    }
  }
  return null;
}

/**
 * Convenience functions for each entity type
 */
export const ReferenceIdGenerators = {
  donation: () => generateReferenceId(EntityType.DONATION),
  moneyDonation: (donorName: string) => generateReferenceId(EntityType.MONEY_DONATION, { name: donorName }),
  shoeRequest: () => generateReferenceId(EntityType.SHOE_REQUEST),
  order: () => generateReferenceId(EntityType.ORDER),
  volunteer: () => generateReferenceId(EntityType.VOLUNTEER),
  partnership: () => generateReferenceId(EntityType.PARTNERSHIP),
  contact: () => generateReferenceId(EntityType.CONTACT)
};

/**
 * Migration mapping for existing reference IDs
 */
export const LEGACY_ID_MAPPING = {
  // Map old formats to new formats
  'DS-': 'DON-', // Old donation format to new
  'REQ-': 'REQ-', // Request format is already correct
  'DM-': 'DM-'    // Money donation format is already correct
};

/**
 * Convert legacy reference ID to new format
 */
export function migrateLegacyReferenceId(legacyId: string): string {
  // Check if it's already in the correct format
  for (const entityType of Object.values(EntityType)) {
    if (validateReferenceId(legacyId, entityType)) {
      return legacyId; // Already in correct format
    }
  }
  
  // Handle specific legacy patterns
  if (legacyId.startsWith('DS-')) {
    // Convert DS-XXXX-YYYY to DON-YYYYMMDD-XXXX format
    const parts = legacyId.split('-');
    if (parts.length === 3) {
      // Generate new date-based donation ID
      return generateReferenceId(EntityType.DONATION);
    }
  }
  
  // If no conversion possible, return as-is
  return legacyId;
}

/**
 * Generate reference ID statistics
 */
export function generateReferenceIdStats(referenceIds: string[]): {
  totalCount: number;
  byEntityType: Record<string, number>;
  validCount: number;
  invalidCount: number;
  legacyCount: number;
} {
  const stats = {
    totalCount: referenceIds.length,
    byEntityType: {} as Record<string, number>,
    validCount: 0,
    invalidCount: 0,
    legacyCount: 0
  };
  
  for (const id of referenceIds) {
    const parsed = parseReferenceId(id);
    
    if (parsed.isValid && parsed.entityType) {
      stats.validCount++;
      stats.byEntityType[parsed.entityType] = (stats.byEntityType[parsed.entityType] || 0) + 1;
    } else {
      stats.invalidCount++;
    }
    
    // Check for legacy formats
    if (id.startsWith('DS-') || id.includes('XXXX')) {
      stats.legacyCount++;
    }
  }
  
  return stats;
} 