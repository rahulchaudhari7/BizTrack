import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  quantityPurchased: number;
  quantitySold: number;
  currentStock: number;
  unit: string;
  minimumStock: number;
  supplier?: string;
  purchaseDate?: Date;
  isVatApplicable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    buyingPrice: {
      type: Number,
      required: [true, 'Buying price (NPR) is required'],
      min: [0, 'Buying price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price (NPR) is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    quantityPurchased: {
      type: Number,
      default: 0,
      min: [0, 'Quantity purchased cannot be negative'],
    },
    quantitySold: {
      type: Number,
      default: 0,
      min: [0, 'Quantity sold cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Current stock cannot be negative'],
    },
    unit: {
      type: String,
      default: 'Piece',
      trim: true,
    },
    minimumStock: {
      type: Number,
      default: 5,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
      default: '',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    isVatApplicable: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ userId: 1, name: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
