import mongoose, { Model, models } from 'mongoose';

// Define interfaces for Settings model
export interface SettingsDocument extends mongoose.Document {
  key: string;
  value: any;
  lastUpdated: Date;
  updatedBy: mongoose.Types.ObjectId;
}

// Define the schema
const settingsSchema = new mongoose.Schema<SettingsDocument>({
  key: {
    type: String,
    required: true,
    unique: true,
    // Removed explicit index - unique: true already creates an index
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    required: true,
  },
});

// Create and export the model
export const SettingsModel: Model<SettingsDocument> = 
  (models?.Settings as Model<SettingsDocument>) || mongoose.model<SettingsDocument>('Settings', settingsSchema);

export default SettingsModel; 