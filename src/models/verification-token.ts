import mongoose, { Schema, Document, Model } from 'mongoose';

export interface VerificationTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationTokenSchema = new Schema<VerificationTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster lookup and automatic token expiration
VerificationTokenSchema.index({ userId: 1 });
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 }); // TTL index, auto-delete expired tokens

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const VerificationToken = (mongoose.models.VerificationToken || 
  mongoose.model<VerificationTokenDocument>('VerificationToken', VerificationTokenSchema)) as Model<VerificationTokenDocument>;

export default VerificationToken; 