import mongoose, { Schema, Document, Model } from 'mongoose';

export type InterestType = 'general' | 'partnership' | 'volunteer' | 'donation';

export type InterestStatus = 'new' | 'contacted' | 'in_progress' | 'closed';

export interface InterestDocument extends Document {
  interestId: string;
  type: InterestType;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  organizationName?: string;
  organizationType?: string;
  subject?: string;
  message: string;
  source?: string;
  status: InterestStatus;
  notes?: string;
  submittedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const InterestSchema = new Schema<InterestDocument>(
  {
    interestId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['general', 'partnership', 'volunteer', 'donation'],
      default: 'general',
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
    },
    organizationName: {
      type: String,
    },
    organizationType: {
      type: String,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: 'contact-form',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'in_progress', 'closed'],
      default: 'new',
      index: true,
    },
    notes: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

InterestSchema.index({ createdAt: -1 });

const Interest = (mongoose.models.Interest || mongoose.model<InterestDocument>('Interest', InterestSchema)) as Model<InterestDocument>;

export default Interest;
