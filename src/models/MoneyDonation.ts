import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMoneyDonation extends Document {
  donationId: string;
  name: string;
  email?: string;
  phone?: string;
  amount: number;
  notes?: string;
  status: 'submit' | 'received' | 'processed' | 'cancelled';
  userId?: string;
  receivedDate?: Date;
  checkNumber?: string;
  receiptSent?: boolean;
  receiptDate?: Date;
  isOffline?: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Define the schema
const moneyDonationSchema = new Schema<IMoneyDonation>({
  donationId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    required: true,
    enum: ['submit', 'received', 'processed', 'cancelled'],
    default: 'submit',
  },
  userId: {
    type: String,
    ref: 'User',
    sparse: true,
  },
  receivedDate: {
    type: Date,
  },
  checkNumber: {
    type: String,
  },
  receiptSent: {
    type: Boolean,
    default: false,
  },
  receiptDate: {
    type: Date,
  },
  isOffline: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// Create indexes
moneyDonationSchema.index({ email: 1 });
moneyDonationSchema.index({ status: 1 });
moneyDonationSchema.index({ userId: 1 });
moneyDonationSchema.index({ createdAt: -1 });
moneyDonationSchema.index({ isOffline: 1 });

// Create or use the existing model
const MoneyDonation: Model<IMoneyDonation> = 
  mongoose.models.MoneyDonation || 
  mongoose.model<IMoneyDonation>('MoneyDonation', moneyDonationSchema);

export default MoneyDonation; 