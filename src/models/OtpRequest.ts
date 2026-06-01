import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpRequest extends Document {
  mobile: string;
  codeHash: string;
  attempts: number;
  verifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const OtpRequestSchema: Schema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verifiedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: Mongo will remove documents after expiresAt
OtpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtpRequest>('OtpRequest', OtpRequestSchema);
