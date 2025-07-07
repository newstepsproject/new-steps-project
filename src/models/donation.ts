import mongoose, { Schema, Document, Model } from 'mongoose';
import { DONATION_STATUSES } from '@/constants/config';

// Define interfaces for donation components
export interface DonorAddress {
  street?: string; // Optional for admin/offline operations
  city?: string; // Optional for admin/offline operations
  state?: string; // Optional for admin/offline operations
  zipCode?: string; // Optional for admin/offline operations
  country?: string; // Optional for admin/offline operations
}

export interface DonorInfo {
  firstName: string;
  lastName: string;
  name?: string; // Keep for backward compatibility
  email?: string; // Optional for offline donations
  phone?: string; // Optional for offline donations
  address?: DonorAddress; // Single address field - no duplication
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
}

// Define the Donation document interface
export interface DonationDocument extends Document {
  donationId: string;
  donationType: 'shoes' | 'money';
  
  // USER INFORMATION - Use EITHER userId OR donorInfo, never both
  userId?: mongoose.Types.ObjectId; // For online donations (logged-in users)
  donorInfo?: DonorInfo; // For offline donations (manual entries)
  
  // DONATION DETAILS
  donationDescription: string;
  pickupPreference?: string;
  status: string;
  statusHistory: StatusHistoryEntry[];
  donationDate: Date;
  pickupDate?: Date;
  receiveDate?: Date;
  processingDate?: Date;
  notes?: string;
  adminNotes?: string;
  
  // DONATION TYPE FLAGS
  isOffline?: boolean; // True for manual entries, false for online submissions
  isBayArea?: boolean; // Whether donor is in Bay Area for pickup
  
  // METADATA
  numberOfShoes?: number; // Total number of shoes donated
  createdBy?: string; // Email of admin who created manual entry
  createdAt: Date;
  updatedAt: Date;
}

const DonorAddressSchema = new Schema<DonorAddress>({
  street: { type: String, required: false }, // Optional for admin/offline operations
  city: { type: String, required: false }, // Optional for admin/offline operations
  state: { type: String, required: false }, // Optional for admin/offline operations
  zipCode: { type: String, required: false }, // Optional for admin/offline operations
  country: { type: String, required: false, default: 'USA' } // Optional with default
});

const DonorInfoSchema = new Schema<DonorInfo>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String, required: false }, // Keep for backward compatibility
  email: { type: String, required: false }, // Optional for offline donations
  phone: { type: String, required: false }, // Optional for offline donations
  address: { type: DonorAddressSchema, required: false } // Single address field
});

// Pre-save hook for DonorInfo to ensure name consistency
DonorInfoSchema.pre('save', function(next) {
  // If firstName and lastName are set but name is not, generate name
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  // If name is set but firstName and lastName are not, split name
  else if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.trim().split(' ');
    if (nameParts.length >= 2) {
      this.firstName = nameParts[0];
      this.lastName = nameParts.slice(1).join(' ');
    } else {
      this.firstName = this.name;
      this.lastName = '';
    }
  }
  next();
});

const StatusHistoryEntrySchema = new Schema<StatusHistoryEntry>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: String
});

// Create the donation schema
const DonationSchema = new Schema<DonationDocument>(
  {
    donationId: {
      type: String,
      required: true,
      unique: true
    },
    donationType: {
      type: String,
      enum: ['shoes', 'money'],
      required: true,
      default: 'shoes'
    },
    
    // USER INFORMATION - Use EITHER userId OR donorInfo
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Only for online donations
    },
    donorInfo: {
      type: DonorInfoSchema,
      required: false // Only for offline donations
    },
    
    // DONATION DETAILS
    donationDescription: {
      type: String,
      required: true
    },
    pickupPreference: String,
    status: {
      type: String,
      enum: Object.values(DONATION_STATUSES),
      default: DONATION_STATUSES.PENDING
    },
    statusHistory: [StatusHistoryEntrySchema],
    donationDate: {
      type: Date,
      default: Date.now
    },
    pickupDate: Date,
    receiveDate: Date,
    processingDate: Date,
    notes: String,
    adminNotes: String,
    
    // DONATION TYPE FLAGS
    isOffline: {
      type: Boolean,
      default: false
    },
    isBayArea: {
      type: Boolean,
      default: false
    },
    
    // METADATA
    numberOfShoes: {
      type: Number,
      min: 1
    },
    createdBy: String
  },
  {
    timestamps: true
  }
);

// Validation: Ensure proper user information is provided based on donation type
DonationSchema.pre('validate', function(next) {
  if (this.isOffline) {
    // Offline donations (admin-created) must have donorInfo
    if (!this.donorInfo) {
      return next(new Error('Offline donations must include donor information'));
    }
    // Offline donations should not have userId
    if (this.userId) {
      console.warn('Offline donation has userId - this may indicate data inconsistency');
    }
  } else {
    // Online donations can have either userId (logged-in users) OR donorInfo (anonymous users)
    if (!this.userId && !this.donorInfo) {
      return next(new Error('Online donations must have either user account or donor information'));
    }
    // If both are provided, that's OK - logged-in user with additional donor info
  }
  next();
});

// Create indexes for faster lookups
// Note: userId index is already created by the ref option in the schema definition
DonationSchema.index({ status: 1 });
DonationSchema.index({ donationType: 1 });
DonationSchema.index({ donationDate: 1 });
DonationSchema.index({ 'donorInfo.email': 1 });
DonationSchema.index({ isOffline: 1 });

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const Donation = (mongoose.models.Donation || mongoose.model<DonationDocument>('Donation', DonationSchema)) as Model<DonationDocument>;

export default Donation; 