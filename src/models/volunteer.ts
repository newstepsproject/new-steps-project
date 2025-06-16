import mongoose, { Schema, Document, Model } from 'mongoose';

// Define interfaces for volunteer components
export interface VolunteerDocument extends Document {
  volunteerId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
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
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
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

// Create indexes for faster lookups
volunteerSchema.index({ userId: 1 });
volunteerSchema.index({ email: 1 });
volunteerSchema.index({ status: 1 });
volunteerSchema.index({ submittedAt: 1 });

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const Volunteer = (mongoose.models.Volunteer || mongoose.model<VolunteerDocument>('Volunteer', volunteerSchema)) as Model<VolunteerDocument>;

export default Volunteer