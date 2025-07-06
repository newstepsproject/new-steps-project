import mongoose, { Schema, Document, Model } from 'mongoose';
import { SHOE_STATUSES } from '@/constants/config';
import Counter from './counter';

// Define interfaces for shoe components
export interface ShoeReview {
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Define the Shoe document interface
export interface ShoeDocument extends Document {
  shoeId: number; // Sequential ID (101, 102, etc.)
  sku: string;
  brand: string;
  modelName: string;
  gender: 'men' | 'women' | 'unisex' | 'boys' | 'girls';
  size: string;
  color: string;
  sport: string;
  condition: 'like_new' | 'good' | 'fair';
  description?: string;
  features?: string[];
  images: string[];
  status: string;
  donationId?: mongoose.Types.ObjectId;
  donorFirstName?: string; // Optional donor first name for unlinked donations
  donorLastName?: string; // Optional donor last name for unlinked donations
  donorName?: string; // Keep for backward compatibility
  donorEmail?: string; // Optional donor email for unlinked donations
  order?: mongoose.Types.ObjectId;
  reviews: ShoeReview[];
  averageRating: number;
  dateAdded: Date;
  lastUpdated: Date;
  inventoryNotes?: string;
  inventoryCount: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create schema for shoe reviews
const ShoeReviewSchema = new Schema<ShoeReview>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the shoe schema
const ShoeSchema = new Schema<ShoeDocument>(
  {
    shoeId: {
      type: Number,
      unique: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      unique: true
    },
    brand: {
      type: String,
      required: true,
      index: true
    },
    modelName: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex', 'boys', 'girls'],
      required: true
    },
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    sport: {
      type: String,
      required: true
    },
    condition: {
      type: String,
      enum: ['like_new', 'good', 'fair'],
      required: true,
      index: true
    },
    description: String,
    features: [String],
    images: {
      type: [String],
      required: true
    },
    status: {
      type: String,
      enum: Object.values(SHOE_STATUSES),
      default: SHOE_STATUSES.AVAILABLE
    },
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation'
    },
    donorFirstName: String,
    donorLastName: String,
    donorName: String,
    donorEmail: String,
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    reviews: [ShoeReviewSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    dateAdded: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    inventoryNotes: String,
    inventoryCount: {
      type: Number,
      default: 1,
      min: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Create compound indexes for better performance on common queries
ShoeSchema.index({ sport: 1, gender: 1, size: 1 });
ShoeSchema.index({ brand: 1, modelName: 1 });
ShoeSchema.index({ status: 1, dateAdded: -1 });
ShoeSchema.index({ status: 1, inventoryCount: 1 }); // New index for available shoes

// Method to increment view count
ShoeSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Pre-validate hook to generate sequential ID for new documents
ShoeSchema.pre('validate', async function(next) {
  // Generate sequential ID only for new documents
  if (this.isNew && !this.shoeId) {
    try {
      this.shoeId = await Counter.getNextSequence('shoeId');
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-save hook to update lastUpdated field
ShoeSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const Shoe = (mongoose.models.Shoe || mongoose.model<ShoeDocument>('Shoe', ShoeSchema)) as Model<ShoeDocument>;

export default Shoe; 