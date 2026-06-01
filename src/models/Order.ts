import mongoose, { Schema, Document } from 'mongoose';

export type ShippingZone = 'inside' | 'outside';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

export interface IOrder extends Document {
  orderId: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    firstName: string;
    lastName?: string;
    address: string;
    city: string;
    state?: string;
    zip?: string;
  };
  shippingZone: ShippingZone;
  shippingFee: number;
  subtotal: number;
  total: number;
  paymentMethod: 'cod';
  status: OrderStatus;
  createdAt: Date;
}

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  nameSnapshot: { type: String, required: true },
  priceSnapshot: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const OrderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zip: { type: String },
    },
    shippingZone: { type: String, enum: ['inside', 'outside'], required: true },
    shippingFee: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    status: { type: String, enum: ['pending','confirmed','shipped','delivered','cancelled'], default: 'pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
