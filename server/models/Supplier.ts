import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  panNumber?: string;
  address?: string;
  province?: string;
  district?: string;
  municipality?: string;
  totalPurchases: number;
  purchaseCount: number;
  totalDue: number;
  lastPurchaseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
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
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchaseCount: {
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

SupplierSchema.index({ userId: 1, name: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
