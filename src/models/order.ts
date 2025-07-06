import mongoose, { Schema, Document, Model } from 'mongoose';
import { ORDER_STATUSES } from '@/constants/config';
import { UserDocument } from '@/types/user';

// Define interfaces for the Order model components
export interface OrderItem {
  shoeId: number;
  shoeName: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  provider: 'stripe' | 'paypal';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface StatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

// Define the Order document interface
export interface OrderDocument extends Document {
  orderId: string;
  userId: mongoose.Types.ObjectId | UserDocument;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingFee: number;
  totalCost: number;
  paymentInfo: PaymentInfo;
  status: string;
  statusHistory: StatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// Create schema for order components
const OrderItemSchema = new Schema<OrderItem>({
  shoeId: {
    type: Number,
    required: true
  },
  shoeName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

const ShippingAddressSchema = new Schema<ShippingAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const PaymentInfoSchema = new Schema<PaymentInfo>({
  provider: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
});

const StatusHistorySchema = new Schema<StatusHistory>({
  status: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: String
});

// Create the order schema
const OrderSchema = new Schema<OrderDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [OrderItemSchema],
    shippingAddress: ShippingAddressSchema,
    shippingFee: {
      type: Number,
      required: true,
      default: 5
    },
    totalCost: {
      type: Number,
      required: true
    },
    paymentInfo: PaymentInfoSchema,
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING
    },
    statusHistory: [StatusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Create indexes for faster lookups
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'items.shoeId': 1 });
OrderSchema.index({ createdAt: 1 });

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const Order = (mongoose.models.Order || mongoose.model<OrderDocument>('Order', OrderSchema)) as Model<OrderDocument>;

export default Order; 