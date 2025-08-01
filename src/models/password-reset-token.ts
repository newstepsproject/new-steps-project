import mongoose, { Schema, Document } from 'mongoose';

export interface PasswordResetTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<PasswordResetTokenDocument>(
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
// Note: userId index is already created by the ref option in the schema definition
// Note: token index is already created by the unique: true option in the schema definition
PasswordResetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

// Create and export the model, checking if it already exists to avoid Next.js hot reload issues
const PasswordResetToken = mongoose.models.PasswordResetToken ||
  mongoose.model<PasswordResetTokenDocument>(
    'PasswordResetToken',
    PasswordResetTokenSchema
  );

export default PasswordResetToken; 