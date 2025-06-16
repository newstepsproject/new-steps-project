import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user role enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

// Define the base user interface
export interface IUser {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  name?: string; // Keeping for backward compatibility
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Optional fields
  schoolName?: string;
  grade?: string;
  sports?: string[];
  sportClub?: string;
  // OAuth related
  googleId?: string;
  emailVerified: boolean;
  // System fields
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  // References
  orders?: mongoose.Types.ObjectId[];
  donations?: mongoose.Types.ObjectId[];
}

// Define the user document interface
export interface UserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create the address schema
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

// Create the user schema
const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      select: false
    },
    firstName: {
      type: String,
      required: false // Not required for backward compatibility
    },
    lastName: {
      type: String,
      required: false // Not required for backward compatibility
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: AddressSchema,
    // Optional fields
    schoolName: String,
    grade: String,
    sports: [String],
    sportClub: String,
    // OAuth related
    googleId: String,
    emailVerified: {
      type: Boolean,
      default: false
    },
    // System fields
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    },
    // References
    orders: [{
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }],
    donations: [{
      type: Schema.Types.ObjectId,
      ref: 'Donation'
    }]
  },
  {
    timestamps: true
  }
);

// Add indexes for faster lookup
UserSchema.index({ googleId: 1 });
UserSchema.index({ role: 1 });
// Email index is automatically created by unique: true, so removed duplicate explicit index
UserSchema.index({ firstName: 1, lastName: 1 });

// Pre-save hook to ensure name is always set
UserSchema.pre('save', function(next) {
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

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // Need to select the password first as it's not included by default
    if (!this.password) {
      const user = await mongoose.model<UserDocument>('User').findById(this._id).select('+password');
      if (!user || !user.password) return false;
      return bcrypt.compare(candidatePassword, user.password);
    }
    return bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const User = (mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema)) as Model<UserDocument>;

export default User; 