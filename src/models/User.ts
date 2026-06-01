import mongoose, { Schema, Document } from 'mongoose';

export type UserStatus = 'active' | 'blocked';

export interface IUser extends Document {
  mobile: string;
  name?: string;
  email?: string;
  status: UserStatus;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    mobile: { type: String, required: true, unique: true, match: /^01\d{9}$/ },
    name: { type: String },
    email: { type: String },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IUser>('User', UserSchema);
