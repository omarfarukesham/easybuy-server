import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  active: boolean;
}

const CategorySchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tagline: { type: String },
    description: { type: String },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
