// Project configuration constants

export const APP_NAME = "New Steps Project";
export const APP_DESCRIPTION = 'Platform for donating and redistributing used sports shoes to those in need';

export const CONTACT_INFO = {
  address: "348 Cardona Cir, San Ramon, CA 94583, USA",
  managerName: "Walter Zhang",
  email: "walterzhang10@gmail.com",
  phone: "(916) 582-7090",
};

export const DEFAULT_SHIPPING_FEE = 5; // in dollars

export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURN_REQUESTED: "requested_return",
  RETURN_RECEIVED: "return_received",
};

export const DONATION_STATUSES = {
  SUBMITTED: "submitted",
  PICKED_UP: "picked_up",
  RECEIVED: "received",
  PROCESSED: "processed",
  CANCELLED: "cancelled"
};

// Define allowed status transitions
export const DONATION_STATUS_TRANSITIONS = {
  [DONATION_STATUSES.SUBMITTED]: [
    DONATION_STATUSES.PICKED_UP, 
    DONATION_STATUSES.CANCELLED
  ],
  [DONATION_STATUSES.PICKED_UP]: [
    DONATION_STATUSES.RECEIVED, 
    DONATION_STATUSES.CANCELLED
  ],
  [DONATION_STATUSES.RECEIVED]: [
    DONATION_STATUSES.PROCESSED,
    DONATION_STATUSES.CANCELLED
  ],
  [DONATION_STATUSES.PROCESSED]: [],  // Terminal state - no further transitions
  [DONATION_STATUSES.CANCELLED]: []   // Terminal state - no further transitions
};

// Updated shoe condition options with more descriptive labels
export const SHOE_CONDITION_OPTIONS = [
  { value: "like_new", label: "Like New (Worn only a few times, almost new appearance)" },
  { value: "good", label: "Good (Visible wear but fully functional, some cosmetic issues)" },
  { value: "fair", label: "Fair (Significant wear but usable, visible signs of use)" },
];

// Gender options for shoes
export const SHOE_GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
  { value: "unisex", label: "Unisex" },
];

export const SPORTS_LIST = [
  "Soccer",
  "Basketball",
  "Baseball",
  "Hockey",
  "Football",
  "Tennis",
  "Track and Field",
  // Add other sports as needed
];

// Bay Area ZIP codes (simplified for example)
export const BAY_AREA_ZIP_CODES = [
  // San Francisco
  "94101", "94102", "94103", "94104", "94105", "94107", "94108", "94109", "94110", "94111", "94112", "94114", "94115", "94116", "94117", "94118", "94121", "94122", "94123", "94124", "94127", "94129", "94130", "94131", "94132", "94133", "94134", "94158",
  // San Jose
  "95101", "95110", "95111", "95112", "95113", "95116", "95117", "95118", "95119", "95120", "95121", "95122", "95123", "95124", "95125", "95126", "95127", "95128", "95129", "95130", "95131", "95132", "95133", "95134", "95135", "95136", "95138", "95139", "95148",
  // Oakland
  "94601", "94602", "94603", "94604", "94605", "94606", "94607", "94609", "94610", "94611", "94612", "94613", "94618", "94619", "94621",
  // San Ramon (where the project office is located)
  "94582", "94583",
];

export const MAX_SHOE_PHOTOS = 4;

// Application-wide constants and configuration

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Authentication
export const AUTH_COOKIE_NAME = 'new-steps-auth';
export const AUTH_COOKIE_EXPIRES = 30; // days

// Image storage
export const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || 'https://d38dol7vzd8qs4.cloudfront.net';
export const DEFAULT_SHOE_IMAGE = `${CLOUDFRONT_URL}/images/default-shoe.png`;

// Pagination
export const ITEMS_PER_PAGE = 12;
export const MAX_PAGINATION_ITEMS = 7;

// Form validation
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Shoe sizes
export const US_MEN_SIZES = [
  '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', 
  '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14'
];

export const US_WOMEN_SIZES = [
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', 
  '9.5', '10', '10.5', '11', '11.5', '12'
];

export const US_YOUTH_SIZES = [
  '3.5Y', '4Y', '4.5Y', '5Y', '5.5Y', '6Y', '6.5Y', '7Y'
];

export const SHOE_SPORTS = [
  'Running',
  'Basketball',
  'Soccer',
  'Tennis',
  'Volleyball',
  'Cross-Training',
  'Walking',
  'Golf',
  'Baseball',
  'Football',
  'Track & Field',
  'Hiking',
  'Skateboarding',
  'Other'
];

// Updated shoe conditions array to match the options
export const SHOE_CONDITIONS = [
  'Like New',
  'Good',
  'Fair'
];

// Shoe gender options as simple strings
export const SHOE_GENDERS = [
  'Men',
  'Women',
  'Boys',
  'Girls',
  'Unisex'
];

export const SHOE_BRANDS = [
  'Nike',
  'Adidas',
  'New Balance',
  'Asics',
  'Brooks',
  'Saucony',
  'Hoka',
  'Under Armour',
  'Reebok',
  'Puma',
  'Mizuno',
  'On Running',
  'Altra',
  'Converse',
  'Vans',
  'Other'
];

// Bay Area ZIP codes
export const BAY_AREA_ZIP_CODES_APP = [
  '94002', '94005', '94010', '94014', '94015', '94020', '94021', '94025', 
  '94027', '94030', '94037', '94038', '94044', '94060', '94061', '94062', 
  '94063', '94065', '94066', '94070', '94074', '94080', '94083', '94085', 
  '94086', '94087', '94089', '94102', '94103', '94104', '94105', '94107', 
  '94108', '94109', '94110', '94111', '94112', '94114', '94115', '94116', 
  '94117', '94118', '94119', '94121', '94122', '94123', '94124', '94127', 
  '94128', '94129', '94130', '94131', '94132', '94133', '94134', '94158', 
  '94301', '94303', '94304', '94305', '94306', '94401', '94402', '94403', 
  '94404', '94501', '94502', '94505', '94506', '94507', '94509', '94510', 
  '94511', '94513', '94514', '94516', '94517', '94518', '94519', '94520', 
  '94521', '94523', '94525', '94526', '94528', '94530', '94531', '94533', 
  '94534', '94536', '94538', '94539', '94541', '94542', '94544', '94545', 
  '94546', '94547', '94548', '94549', '94550', '94551', '94552', '94553', 
  '94555', '94556', '94558', '94559', '94560', '94561', '94564', '94565', 
  '94566', '94568', '94569', '94571', '94572', '94574', '94577', '94578', 
  '94580', '94582', '94583', '94585', '94586', '94587', '94588', '94589', 
  '94590', '94591', '94592', '94595', '94596', '94597', '94598', '94599', 
  '94601', '94602', '94603', '94605', '94606', '94607', '94608', '94609', 
  '94610', '94611', '94612', '94613', '94618', '94619', '94621', '94702', 
  '94703', '94704', '94705', '94706', '94707', '94708', '94709', '94710', 
  '94720', '94801', '94803', '94804', '94805', '94806', '94901', '94903', 
  '94904', '94920', '94922', '94923', '94924', '94925', '94928', '94929', 
  '94930', '94931', '94933', '94937', '94938', '94939', '94940', '94941', 
  '94945', '94946', '94947', '94949', '94950', '94951', '94952', '94954', 
  '94956', '94957', '94960', '94963', '94964', '94965', '94970', '94971', 
  '94972', '94973', '94974', '94975', '94976', '94977', '94978', '94979', 
  '94998', '94999'
];

// Site configuration
export const SITE_CONFIG = {
  name: 'New Steps',
  description: 'Connecting donated sports shoes with athletes in need',
  url: 'https://newsteps.fit',
  adminUrl: 'https://admin.newsteps.fit',
  contactEmail: 'contact@newsteps.fit',
  supportEmail: 'support@newsteps.fit',
  donationsEmail: 'donations@newsteps.fit'
};

// Shoe status options
export const SHOE_STATUSES = {
  AVAILABLE: 'available',
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  RESERVED: 'reserved',
  ORDERED: 'ordered',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  PENDING_INVENTORY: 'pending_inventory',
  UNAVAILABLE: 'unavailable'
};

// User role options
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Shipping Configuration
export const SHIPPING_CONFIG = {
  flatRate: 5.00,
  freeShippingThreshold: 50.00,
  methods: [
    { id: 'standard', name: 'Standard Shipping', price: 5.00, estimatedDays: '3-5 business days' },
    { id: 'expedited', name: 'Expedited Shipping', price: 15.00, estimatedDays: '2-3 business days' }
  ]
};

// Pagination defaults
export const PAGINATION = {
  defaultLimit: 12,
  maxLimit: 50
};

// File upload limits
export const UPLOAD_LIMITS = {
  // Maximum file size in bytes (5MB)
  maxFileSize: 5 * 1024 * 1024,
  // Maximum number of files per shoe
  maxFiles: 5,
  // Allowed file types
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  // Maximum image dimensions for compression
  maxWidth: 1920,
  // JPEG quality for compression (0-1)
  compressionQuality: 0.8,
};

// API endpoints
export const API_ENDPOINTS = {
  // Image upload endpoints
  imageUpload: '/api/images/upload',
  imageUploadTest: '/api/test/images/upload',
  // Donation endpoints
  donations: '/api/donations',
  donationsTest: '/api/test/donations',
};

// Application feature flags
export const FEATURES = {
  // Enable/disable image compression
  imageCompression: true,
  // Enable/disable image upload
  imageUpload: true,
  // Enable/disable donation test mode
  testMode: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_TEST_MODE === 'true',
}; 