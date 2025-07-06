// Shoe-related constants extracted from config.ts

// Shoe sports
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

// Shoe conditions
export const SHOE_CONDITIONS = {
  LIKE_NEW: 'like_new',
  GOOD: 'good',
  FAIR: 'fair'
};

// Shoe genders
export const SHOE_GENDERS = [
  'Men',
  'Women',
  'Boys',
  'Girls',
  'Unisex'
];

// Shoe brands
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

// Shoe status options - Simplified 4-status system
export const SHOE_STATUSES = {
  AVAILABLE: 'available',     // Ready to be requested
  REQUESTED: 'requested',     // In process (admin handling request)
  SHIPPED: 'shipped',         // Sent to user
  UNAVAILABLE: 'unavailable'  // Not available (damaged, lost, etc.)
}; 