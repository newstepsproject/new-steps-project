import mongoose, { Schema, Document, Model } from 'mongoose';

// Define status enum according to project requirements
export enum ShoeRequestStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved', 
  SHIPPED = 'shipped',
  REJECTED = 'rejected'
}

// Define urgency enum
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Define interfaces
export interface RequestorInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  schoolName?: string;
  grade?: string;
  sportClub?: string;
}

export interface ShippingInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface StatusHistoryEntry {
  status: ShoeRequestStatus;
  timestamp: Date;
  note?: string;
}

export interface ShoeItem {
  // Link to actual inventory shoe
  shoeId?: string; // Sequential shoe ID (001, 002, etc.)
  inventoryId?: mongoose.Types.ObjectId; // MongoDB ObjectId of actual shoe
  // Original request fields for fallback
  brand?: string;
  name?: string;
  size: string;
  gender: string;
  sport?: string;
  condition?: string;
  notes?: string;
}

// Document interface
export interface ShoeRequestDocument extends Document {
  requestId: string;
  requestorInfo: RequestorInfo;
  items: ShoeItem[];
  statusHistory: StatusHistoryEntry[];
  urgency: string;
  shippingInfo: ShippingInfo;
  notes?: string;
  adminNotes?: string;
  isOffline?: boolean;
  createdBy?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  currentStatus?: string;
  shippingFee?: number;
  totalCost?: number;
}

// Create schemas
const RequestorInfoSchema = new Schema<RequestorInfo>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  schoolName: { type: String },
  grade: { type: String },
  sportClub: { type: String }
});

const ShoeItemSchema = new Schema<ShoeItem>({
  shoeId: { type: String }, // Sequential ID for display (001, 002, etc.)
  inventoryId: { type: Schema.Types.ObjectId, ref: 'Shoe' }, // Reference to actual shoe
  brand: { type: String },
  name: { type: String },
  size: { type: String, required: true },
  gender: { type: String, required: true },
  sport: { type: String },
  condition: { type: String },
  notes: { type: String }
});

const ShippingInfoSchema = new Schema<ShippingInfo>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const StatusHistoryEntrySchema = new Schema<StatusHistoryEntry>({
  status: { 
    type: String, 
    enum: Object.values(ShoeRequestStatus),
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
});

// Main schema
const ShoeRequestSchema = new Schema<ShoeRequestDocument>(
  {
    requestId: { type: String, required: true, unique: true },
    requestorInfo: { type: RequestorInfoSchema, required: true },
    items: [ShoeItemSchema],
    statusHistory: [StatusHistoryEntrySchema],
    urgency: { 
      type: String, 
      enum: Object.values(UrgencyLevel), 
      default: UrgencyLevel.MEDIUM 
    },
    shippingInfo: { type: ShippingInfoSchema, required: true },
    notes: { type: String },
    adminNotes: { type: String },
    isOffline: { 
      type: Boolean, 
      default: false 
    },
    createdBy: { type: String },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    currentStatus: { 
      type: String,
      enum: Object.values(ShoeRequestStatus),
      default: ShoeRequestStatus.SUBMITTED
    },
    shippingFee: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Indexes
ShoeRequestSchema.index({ currentStatus: 1 });
ShoeRequestSchema.index({ urgency: 1 });
ShoeRequestSchema.index({ 'requestorInfo.email': 1 });
ShoeRequestSchema.index({ isOffline: 1 });
ShoeRequestSchema.index({ 'items.shoeId': 1 });
ShoeRequestSchema.index({ 'items.inventoryId': 1 });

// Pre-save middleware to ensure status consistency
ShoeRequestSchema.pre('save', function(next) {
  if (this.statusHistory && this.statusHistory.length > 0) {
    // Set currentStatus to the most recent status
    this.currentStatus = this.statusHistory[0].status;
  }
  next();
});

// Method to add status change with validation
ShoeRequestSchema.methods.addStatusChange = function(newStatus: ShoeRequestStatus, note?: string) {
  // Validation: rejected requests cannot change status
  if (this.currentStatus === ShoeRequestStatus.REJECTED) {
    throw new Error('Rejected requests cannot change status');
  }

  // Add new status to the beginning of the array (most recent first)
  this.statusHistory.unshift({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status updated to ${newStatus}`
  });

  this.currentStatus = newStatus;
  return this;
};

// Method to check if status can be changed
ShoeRequestSchema.methods.canChangeStatus = function() {
  return this.currentStatus !== ShoeRequestStatus.REJECTED;
};

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const ShoeRequest = (mongoose.models.ShoeRequest || mongoose.model<ShoeRequestDocument>('ShoeRequest', ShoeRequestSchema)) as Model<ShoeRequestDocument>;

export default ShoeRequest; 