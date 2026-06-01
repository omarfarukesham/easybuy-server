import mongoose, { Schema, Document } from 'mongoose';

export type NewsletterStatus = 'subscribed' | 'unsubscribed';

export interface INewsletterSubscription extends Document {
  email: string;
  status: NewsletterStatus;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

const NewsletterSubscriptionSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed', index: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
});

NewsletterSubscriptionSchema.index({ status: 1, subscribedAt: -1 });

export default mongoose.model<INewsletterSubscription>('NewsletterSubscription', NewsletterSubscriptionSchema);
