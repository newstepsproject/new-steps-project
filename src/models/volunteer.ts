import mongoose, { Schema, Document, Model } from 'mongoose';

// Define interfaces for volunteer components
export interface VolunteerDocument extends Document {
  volunteerId: string;
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  name?: string; // Keep for backward compatibility
  email: string;
  phone?: string;
  city: string;
  state: string;
  availability: string;
  interests: string[];
  skills?: string;
  message?: string;
  status: string;
  submittedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

const volunteerSchema = new Schema<VolunteerDocument>(
  {
    volunteerId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: false // Keep for backward compatibility
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: false,
      default: undefined,
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    availability: {
      type: String,
      required: true
    },
    interests: {
      type: [String],
      required: true
    },
    skills: String,
    message: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'contacted', 'rejected', 'inactive'],
      default: 'pending'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure name consistency
volunteerSchema.pre('save', function(next) {
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

// Create indexes for faster lookups
// Note: userId index is already created by the ref option in the schema definition
volunteerSchema.index({ email: 1 });
volunteerSchema.index({ status: 1 });
volunteerSchema.index({ submittedAt: 1 });

const existingVolunteerModel = mongoose.models.Volunteer as Model<VolunteerDocument> | undefined;

if (existingVolunteerModel) {
  const phonePath = existingVolunteerModel.schema.path('phone');
  const phoneIsRequired = (phonePath?.options as { required?: boolean })?.required;
  if (phoneIsRequired) {
    delete mongoose.models.Volunteer;
  }
}

const Volunteer = (mongoose.models.Volunteer || mongoose.model<VolunteerDocument>('Volunteer', volunteerSchema)) as Model<VolunteerDocument>;

export default Volunteer
