import mongoose, { Schema, Document } from 'mongoose';

export type HeroBannerType = 'main' | 'side';

export interface IHeroBanner extends Document {
  type: HeroBannerType;
  image: string;
  alt: string;
  href?: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
}

const HeroBannerSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['main', 'side'], required: true, index: true },
    image: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
    href: { type: String, trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

HeroBannerSchema.index({ active: 1, type: 1, sortOrder: 1 });

export default mongoose.model<IHeroBanner>('HeroBanner', HeroBannerSchema);
