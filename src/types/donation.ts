// Shared type definitions for donation forms

export interface DonationFormWithMethodData {
  donorInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isBayArea?: boolean;
  };
  shoeDetails: {
    shoes: Array<{
      brand: string;
      modelName: string;
      size: string;
      gender: string;
      condition: string;
      sport: string;
      color: string;
      description?: string;
      images?: string[];
    }>;
  };
  donationMethod: {
    method: 'dropoff' | 'pickup' | 'ship';
  };
  donationDescription: string;
  // Form fields for firstName/lastName
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface MoneyDonationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  amount: string;
  notes?: string;
}

export interface VolunteerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  interests: string[];
  availability: string;
  experience: string;
  motivation: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export interface PartnershipFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  partnershipInterest: string;
  description: string;
} 