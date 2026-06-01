import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  mobile?: string;
  subject: string;
  message: string;
  readAt?: Date;
  createdAt: Date;
}

const ContactMessageSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ readAt: 1, createdAt: -1 });

export default mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
