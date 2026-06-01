import mongoose, { Schema, Document } from 'mongoose';

export type AdminRole = 'owner' | 'manager';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['owner', 'manager'], default: 'manager' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);
