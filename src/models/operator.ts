import mongoose, { Model, models } from 'mongoose';

// Define interfaces for Operator model
export interface OperatorDocument extends mongoose.Document {
  firstName: string;
  lastName: string;
  name?: string; // Keep for backward compatibility
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

// Pre-save hook to ensure name consistency
operatorSchema.pre('save', function(next) {
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

// Define indexes for faster querying
operatorSchema.index({ email: 1 });
operatorSchema.index({ role: 1 });
operatorSchema.index({ isActive: 1 });

// Create and export the model
export const OperatorModel: Model<OperatorDocument> = 
  (models?.Operator as Model<OperatorDocument>) || mongoose.model<OperatorDocument>('Operator', operatorSchema);

export default OperatorModel; 