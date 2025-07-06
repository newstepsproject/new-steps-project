import { z } from 'zod';

// Standardized validation patterns
export const ValidationPatterns = {
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Phone number validation - consistent across all forms
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Phone number format is invalid')
    .transform(val => val.replace(/[\s\-\(\)]/g, '')), // Remove formatting
  
  // Optional phone number
  phoneOptional: z.string()
    .optional()
    .refine(val => !val || (val.length >= 10 && /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''))), 
      'Phone number format is invalid'),
  
  // Name validation
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  // Address validation
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    country: z.string().min(1, 'Country is required').default('USA'),
  }),
  
  // Optional address
  addressOptional: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    country: z.string().min(1, 'Country is required').default('USA'),
  }).optional(),
  
  // Donation amount validation
  donationAmount: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Donation amount must be a positive number')
    .transform(val => parseFloat(val)),
  
  // Shoe ID validation
  shoeId: z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shoe ID format'),
    z.number().int().min(1, 'Invalid shoe ID')
  ]),
  
  // MongoDB ObjectId validation
  mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  
  // Status validation for different entities
  donationStatus: z.enum(['submitted', 'received', 'processed', 'cancelled']),
  shoeRequestStatus: z.enum(['submitted', 'approved', 'shipped', 'rejected']),
  moneyDonationStatus: z.enum(['submitted', 'received', 'processed', 'cancelled']),
  shoeStatus: z.enum(['available', 'requested', 'shipped', 'unavailable']),
  
  // Common text fields
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
};

// Common validation schemas
export const CommonSchemas = {
  // Personal information (used across forms)
  personalInfo: z.object({
    firstName: ValidationPatterns.firstName,
    lastName: ValidationPatterns.lastName,
    email: ValidationPatterns.email,
    phone: ValidationPatterns.phone,
  }),
  
  // Personal information with optional phone
  personalInfoOptionalPhone: z.object({
    firstName: ValidationPatterns.firstName,
    lastName: ValidationPatterns.lastName,
    email: ValidationPatterns.email,
    phone: ValidationPatterns.phoneOptional,
  }),
  
  // Contact form schema
  contactForm: z.object({
    firstName: ValidationPatterns.firstName,
    lastName: ValidationPatterns.lastName,
    email: ValidationPatterns.email,
    subject: ValidationPatterns.subject,
    message: ValidationPatterns.message,
  }),
  
  // Money donation schema
  moneyDonation: z.object({
    firstName: ValidationPatterns.firstName,
    lastName: ValidationPatterns.lastName,
    email: ValidationPatterns.email,
    phone: ValidationPatterns.phoneOptional,
    amount: ValidationPatterns.donationAmount,
    notes: ValidationPatterns.notes,
  }),
  
  // Registration schema
  registration: z.object({
    firstName: ValidationPatterns.firstName,
    lastName: ValidationPatterns.lastName,
    email: ValidationPatterns.email,
    phone: ValidationPatterns.phone,
    password: ValidationPatterns.password,
    address: ValidationPatterns.addressOptional,
    schoolName: z.string().optional(),
    grade: z.string().optional(),
    sports: z.array(z.string()).optional(),
    sportClub: z.string().optional(),
  }),
};

// Validation helper functions
export const ValidationHelpers = {
  // Standardized error response
  formatValidationError: (error: z.ZodError) => {
    return {
      message: 'Validation error',
      errors: error.format(),
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  },
  
  // Check if validation failed and return appropriate response
  validateAndRespond: (schema: z.ZodSchema, data: any) => {
    const validation = schema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: ValidationHelpers.formatValidationError(validation.error),
        status: 400,
      };
    }
    return {
      success: true,
      data: validation.data,
    };
  },
  
  // Validate name fields (supports both single name and firstName/lastName)
  validateNameFields: (data: any) => {
    const hasName = data.name && data.name.trim();
    const hasFirstLastName = data.firstName && data.firstName.trim() && 
                            data.lastName && data.lastName.trim();
    
    if (!hasName && !hasFirstLastName) {
      return {
        success: false,
        error: 'Either name or firstName/lastName is required',
      };
    }
    
    // Ensure name consistency
    if (hasFirstLastName && !hasName) {
      data.name = `${data.firstName} ${data.lastName}`;
    } else if (hasName && !hasFirstLastName) {
      const nameParts = data.name.trim().split(' ');
      if (nameParts.length >= 2) {
        data.firstName = nameParts[0];
        data.lastName = nameParts.slice(1).join(' ');
      } else {
        data.firstName = data.name;
        data.lastName = '';
      }
    }
    
    return {
      success: true,
      data,
    };
  },
};

export default ValidationPatterns; 