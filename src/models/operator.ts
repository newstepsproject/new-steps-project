import mongoose, { Model, models } from 'mongoose';

// Define interfaces for Operator model
export interface OperatorDocument extends mongoose.Document {
  name: string;
  email: string;
  phone?: string;
  role: 'manager' | 'volunteer' | 'admin';
  photo?: string;
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const operatorSchema = new mongoose.Schema<OperatorDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ['manager', 'volunteer', 'admin'],
      required: true,
    },
    photo: {
      type: String,
    },
    bio: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define indexes for faster querying
operatorSchema.index({ email: 1 });
operatorSchema.index({ role: 1 });
operatorSchema.index({ isActive: 1 });

// Create and export the model
export const OperatorModel: Model<OperatorDocument> = 
  (models?.Operator as Model<OperatorDocument>) || mongoose.model<OperatorDocument>('Operator', operatorSchema);

export default OperatorModel; 