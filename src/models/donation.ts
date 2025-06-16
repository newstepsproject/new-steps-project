import mongoose, { Schema, Document, Model } from 'mongoose';
import { DONATION_STATUSES } from '@/constants/config';

// Define interfaces for donation components
export interface DonorAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface DonorInfo {
  name: string;
  email: string;
  phone: string;
  address?: DonorAddress;
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
  userId?: mongoose.Types.ObjectId; // Optional for offline donations
  donorInfo?: DonorInfo; // For offline donations
  donationDescription: string;
  donorAddress?: DonorAddress; // Separate field for address
  pickupPreference?: string;
  status: string;
  statusHistory: StatusHistoryEntry[];
  donationDate: Date;
  pickupDate?: Date;
  receiveDate?: Date;
  processingDate?: Date;
  notes?: string;
  adminNotes?: string;
  isOffline?: boolean; // True for manual entries
  isBayArea?: boolean; // Whether donor is in Bay Area for pickup
  numberOfShoes?: number; // Total number of shoes donated
  createdBy?: string; // Email of admin who created manual entry
  createdAt: Date;
  updatedAt: Date;
}

const DonorAddressSchema = new Schema<DonorAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const DonorInfoSchema = new Schema<DonorInfo>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: DonorAddressSchema, required: false }
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Made optional for offline donations
    },
    donorInfo: {
      type: DonorInfoSchema,
      required: false // Required for offline donations
    },
    donationDescription: {
      type: String,
      required: true
    },
    donorAddress: DonorAddressSchema, // Separate field for address
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
    isOffline: {
      type: Boolean,
      default: false
    },
    isBayArea: {
      type: Boolean,
      default: false
    },
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

// Create indexes for faster lookups
// Removed explicit donationId index - unique: true already creates an index
DonationSchema.index({ userId: 1 });
DonationSchema.index({ status: 1 });
DonationSchema.index({ donationDate: 1 });
DonationSchema.index({ donationType: 1 });
DonationSchema.index({ isOffline: 1 });

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const Donation = (mongoose.models.Donation || mongoose.model<DonationDocument>('Donation', DonationSchema)) as Model<DonationDocument>;

export default Donation; 