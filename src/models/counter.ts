import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Counter document interface
export interface CounterDocument extends Document {
  _id: string;
  seq: number;
}

// Create the counter schema
const CounterSchema = new Schema<CounterDocument>({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 100 // Start from 100 so first ID will be 101
  }
});

// Static method to get next sequence value
CounterSchema.statics.getNextSequence = async function(sequenceName: string): Promise<string> {
  const counter = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  // Return natural number as string (101, 102, ...)
  return counter.seq.toString();
};

// Create and export the model
const Counter = (mongoose.models.Counter || mongoose.model<CounterDocument>('Counter', CounterSchema)) as Model<CounterDocument> & {
  getNextSequence: (sequenceName: string) => Promise<string>;
};

export default Counter; 