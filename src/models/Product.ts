import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  slug: string;
  name: string;
  description?: string;
  longDescription?: string;
  category?: mongoose.Types.ObjectId;
  brand?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image?: string;
  gallery: string[];
  highlights: string[];
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    longDescription: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    brand: { type: String },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String },
    gallery: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, index: true, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IProduct>("Product", ProductSchema);
