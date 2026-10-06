import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  panNumber?: string;
  address?: string;
  province?: string;
  district?: string;
  municipality?: string;
  wardNo?: string;
  tole?: string;
  totalPurchases: number;
  transactionCount: number;
  totalDue: number;
  lastPurchaseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    panNumber: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    province: {
      type: String,
      default: 'Bagmati Province',
      trim: true,
    },
    district: {
      type: String,
      default: 'Kathmandu',
      trim: true,
    },
    municipality: {
      type: String,
      default: '',
      trim: true,
    },
    wardNo: {
      type: String,
      default: '',
      trim: true,
    },
    tole: {
      type: String,
      default: '',
      trim: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ userId: 1, name: 1 });
CustomerSchema.index({ userId: 1, phone: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
