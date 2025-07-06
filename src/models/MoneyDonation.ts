import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMoneyDonation extends Document {
  donationId: string;
  firstName: string;
  lastName: string;
  name?: string; // Keep for backward compatibility
  email?: string;
  phone?: string;
  amount: number;
  notes?: string;
  status: 'submitted' | 'received' | 'processed' | 'cancelled';
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
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false, // Keep for backward compatibility
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
    enum: ['submitted', 'received', 'processed', 'cancelled'],
    default: 'submitted',
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

// Pre-save hook to ensure name consistency
moneyDonationSchema.pre('save', function(next) {
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